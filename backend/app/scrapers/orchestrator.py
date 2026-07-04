"""
Update Orchestrator
Coordinates the full scheme update pipeline:
1. Initialize audit logs (`UpdateRun`).
2. Run registered scrapers concurrently.
3. Normalize and deduplicate raw payloads.
4. Run AI enrichment on staging candidates.
5. Save candidates to `scheme_staging`.
6. Auto-apply high-confidence updates/new schemes if configured.
"""

import asyncio
import logging
from datetime import datetime
from sqlalchemy import select

from app.database import async_session
from app.models.staging import UpdateRun, SchemeStagingEntry
from app.models.scheme import Scheme, EligibilityRule
from app.scrapers import get_all_scrapers
from app.scrapers.normalizer import SchemaNormalizer
from app.scrapers.dedup import DeduplicationEngine
from app.scrapers.enrichment import AIEnrichmentService
from app.config import get_settings

logger = logging.getLogger("yojana.scrapers.orchestrator")
settings = get_settings()


class UpdateOrchestrator:
    """
    Manages the lifecycle of a complete automatic scheme update transaction.
    """

    def __init__(self):
        self.normalizer = SchemaNormalizer()
        self.dedup = DeduplicationEngine(
            fuzzy_threshold=int(settings.update_auto_approve_threshold * 100)
        )
        self.enricher = AIEnrichmentService()

    async def run(self, run_type: str = "manual") -> dict:
        """Runs the entire update pipeline, logging runs and updating staging."""
        # 1. Create run audit entry
        run = UpdateRun(
            run_type=run_type,
            started_at=datetime.utcnow(),
            status="running",
            sources_scraped=[],
            errors=[]
        )

        async with async_session() as db:
            db.add(run)
            await db.commit()
            await db.refresh(run)
            run_id = run.id

        logger.info(f"[Orchestrator] Starting run {run_id} ({run_type})")

        # 2. Run scrapers concurrently
        scrapers = get_all_scrapers()
        tasks = [scraper.run() for scraper in scrapers]
        scraped_groups = await asyncio.gather(*tasks, return_exceptions=True)

        raw_records = []
        sources_attempted = []
        errors = []

        for scraper, result in zip(scrapers, scraped_groups):
            sources_attempted.append(scraper.source_name)
            if isinstance(result, Exception):
                logger.error(f"Scraper {scraper.source_name} failed: {result}")
                errors.append({
                    "source": scraper.source_name,
                    "error": str(result),
                    "timestamp": datetime.utcnow().isoformat()
                })
            else:
                raw_records.extend(result)

        logger.info(f"[Orchestrator] Fetched {len(raw_records)} raw records from all sources")

        # 3. Process, Deduplicate, Enrich & Stage records
        new_count = 0
        update_count = 0
        skipped_count = 0

        async with async_session() as db:
            # Re-fetch the update run inside this session's context
            db_run = await db.get(UpdateRun, run_id)
            if not db_run:
                raise RuntimeError(f"Update run {run_id} not found in database")

            db_run.sources_scraped = sources_attempted
            db_run.total_fetched = len(raw_records)
            db_run.errors = errors

            # Group raw records by unique source IDs to avoid processing duplicate updates inside the same run
            seen_ids = set()
            for raw in raw_records:
                unique_key = f"{raw.source_name}_{raw.source_id}"
                if unique_key in seen_ids:
                    continue
                seen_ids.add(unique_key)

                try:
                    # 3.1 Normalize raw fields
                    norm = await self.normalizer.normalize(db, raw)

                    # 3.2 Deduplicate
                    match_type, matched_id, confidence = await self.dedup.classify(db, norm)

                    if match_type == "duplicate":
                        skipped_count += 1
                        continue

                    # 3.3 Enrich only actual new schemes/updates
                    norm = await self.enricher.enrich(norm, raw.eligibility_text)

                    # 3.4 Save to scheme_staging
                    staging_entry = SchemeStagingEntry(
                        source_name=raw.source_name,
                        source_url=raw.source_url,
                        source_id=raw.source_id,
                        raw_data=raw.to_dict(),
                        normalized_name=norm["name"],
                        normalized_slug=norm["slug"],
                        normalized_data=norm,
                        match_type=match_type,
                        matched_scheme_id=matched_id,
                        confidence_score=confidence,
                        status="pending",
                        run_id=run_id
                    )

                    # 3.5 Auto-approve if high confidence
                    if confidence >= settings.update_auto_approve_threshold:
                        applied = await self._apply_staging_to_live(db, staging_entry)
                        if applied:
                            staging_entry.status = "auto_applied"
                            staging_entry.applied_at = datetime.utcnow()

                    db.add(staging_entry)

                    if match_type == "new":
                        new_count += 1
                    elif match_type == "update":
                        update_count += 1

                except Exception as e:
                    logger.error(f"Error staging raw scheme {raw.name}: {e}", exc_info=True)
                    continue

            # Update metrics and finish run
            db_run.new_schemes = new_count
            db_run.updated_schemes = update_count
            db_run.duplicates_skipped = skipped_count
            db_run.completed_at = datetime.utcnow()
            db_run.status = "completed" if not errors else "partial"
            db_run.summary = (
                f"Completed run {run_id}. Staged {new_count} new schemes and "
                f"{update_count} scheme updates. Skipped {skipped_count} duplicates."
            )

            await db.commit()

        logger.info(f"[Orchestrator] Run completed. Staged {new_count} new, {update_count} updates")

        return {
            "run_id": run_id,
            "new_schemes": new_count,
            "updated_schemes": update_count,
            "duplicates_skipped": skipped_count,
            "errors": errors
        }

    async def _apply_staging_to_live(self, db: AsyncSession, entry: SchemeStagingEntry) -> bool:
        """
        Promotes a staged entry into the live schemes table.
        This writes data safely inside the existing session.
        """
        try:
            data = entry.normalized_data
            extracted_rules = data.pop("extracted_rules", [])

            if entry.match_type == "new":
                # Create a new Scheme record
                live_scheme = Scheme(**data)
                db.add(live_scheme)
                await db.flush()  # gets generated live_scheme.id

                # Add extracted eligibility rules
                for rule_data in extracted_rules:
                    rule = EligibilityRule(
                        scheme_id=live_scheme.id,
                        rule_type=rule_data["rule_type"],
                        operator=rule_data["operator"],
                        value=rule_data["value"],
                        is_mandatory=rule_data["is_mandatory"],
                        description=rule_data["description"]
                    )
                    db.add(rule)

            elif entry.match_type == "update" and entry.matched_scheme_id:
                # Update existing Scheme fields
                stmt = select(Scheme).where(Scheme.id == entry.matched_scheme_id)
                res = await db.execute(stmt)
                live_scheme = res.scalar_one_or_none()

                if live_scheme:
                    for key, val in data.items():
                        # Do not overwrite primary keys or creation dates
                        if key not in ("id", "slug", "created_at"):
                            setattr(live_scheme, key, val)
                    live_scheme.last_updated = datetime.utcnow()

            return True
        except Exception as e:
            logger.error(f"Failed to auto-apply staged scheme {entry.normalized_name}: {e}")
            return False
