"""
Database Synchronization Engine (Phase 8).
Transactional processing for syncing validated JSON schemes into the production Schemes database.
Manages updates, batch inserts, audit trails, and automatic deactivations.
"""

import logging
from datetime import datetime, date
from typing import Dict, Any, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

import re
import unicodedata
from app.models.scheme import Scheme
from app.models.audit import SyncAuditLog

def slugify(name: str) -> str:
    """Slugify a scheme name safely (alphanumeric and dashes only)."""
    name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('ascii')
    name = name.lower()
    name = re.sub(r'[^a-z0-9\s-]', '', name)
    name = re.sub(r'[\s-]+', '-', name).strip('-')
    return name

logger = logging.getLogger("yojana.crawler.sync")


class SyncEngineService:
    """
    Manages transaction-wrapped synchronization pipelines from staging data
    into Scheme and SyncAuditLog tables.
    """

    # Change-sensitive fields to track for updates and audit history
    MUTABLE_FIELDS = [
        "name",
        "ministry",
        "department",
        "description",
        "benefits",
        "required_documents",
        "application_process",
        "application_url",
        "official_website",
        "helpline",
        "status",
        "launched_date",
    ]

    def _prepare_data(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitizes and extracts scheme values into standardized keys."""
        # Convert date strings to date objects if present
        launched_date = None
        ld_str = payload.get("launch_date") or payload.get("launched_date")
        if ld_str and str(ld_str).strip().lower() not in ("null", "none", ""):
            try:
                launched_date = datetime.strptime(str(ld_str).strip(), "%Y-%m-%d").date()
            except ValueError:
                pass

        # Normalize required documents format
        docs = payload.get("required_documents")
        if not isinstance(docs, list):
            docs = []

        return {
            "name": str(payload.get("canonical_name") or payload.get("scheme_name") or payload.get("name") or "").strip(),
            "ministry": payload.get("ministry"),
            "department": payload.get("department"),
            "description": payload.get("short_description") or payload.get("description"),
            "benefits": payload.get("benefits"),
            "required_documents": docs,
            "application_process": payload.get("application_process"),
            "application_url": payload.get("official_url") or payload.get("application_url"),
            "official_website": payload.get("official_website"),
            "helpline": payload.get("helpline_number") or payload.get("helpline"),
            "status": "active",
            "launched_date": launched_date,
            "source_url": payload.get("official_url") or payload.get("source_url"),
            "confidence_score": float(payload.get("confidence_score") or 1.0)
        }

    async def sync_batch(
        self, db: AsyncSession, batch: List[Dict[str, Any]], scan_id: str
    ) -> Dict[str, Any]:
        """
        Processes a list of validated payloads: inserts unique items, updates modified items,
        marks missing ones inactive, and commits transactionally.
        """
        stats = {"inserted": 0, "updated": 0, "deactivated": 0, "status": "success", "error": None}
        processed_slugs = set()
        now = datetime.utcnow()

        try:
            # 1. Process batch elements
            for item in batch:
                data = self._prepare_data(item)
                if not data["name"]:
                    raise ValueError("Sync payload is missing a valid scheme name.")

                slug = slugify(data["name"])
                processed_slugs.add(slug)

                # Query existing scheme
                stmt = select(Scheme).where((Scheme.slug == slug) | (Scheme.name == data["name"]))
                res = await db.execute(stmt)
                scheme = res.scalars().first()

                if not scheme:
                    # Check for withdrawn keywords in page text
                    from app.services.lifecycle_engine import lifecycle_engine
                    is_withdrawn, evidence = lifecycle_engine.detect_withdrawn(item.get("clean_text"), data["source_url"])
                    status_val = "withdrawn" if is_withdrawn else "active"
                    is_active_val = False if is_withdrawn else True

                    # Case 1: Insert New Scheme
                    new_scheme = Scheme(
                        name=data["name"],
                        slug=slug,
                        ministry=data["ministry"],
                        department=data["department"],
                        description=data["description"],
                        benefits=data["benefits"],
                        required_documents=data["required_documents"],
                        application_process=data["application_process"],
                        application_url=data["application_url"],
                        official_website=data["official_website"],
                        helpline=data["helpline"],
                        status=status_val,
                        is_active=is_active_val,
                        launched_date=data["launched_date"],
                        last_seen=now,
                        last_checked=now,
                        version=1,
                        source_url=data["source_url"],
                        confidence_score=data["confidence_score"],
                        scan_id=scan_id
                    )

                    db.add(new_scheme)
                    await db.flush()  # Populates new_scheme.id

                    # Create Insert Audit Log
                    audit = SyncAuditLog(
                        operation="INSERT",
                        scheme_id=new_scheme.id,
                        previous_values=None,
                        new_values={k: getattr(new_scheme, k) for k in self.MUTABLE_FIELDS if hasattr(new_scheme, k)},
                        user_system="system",
                        details=f"New scheme '{data['name']}' inserted by scan '{scan_id}'."
                    )
                    db.add(audit)

                    # Record version history
                    from app.services.history_engine import history_engine
                    await history_engine.record_version(
                        db, scheme=new_scheme, change_type="INSERT", actor="system",
                        reason=f"New scheme '{data['name']}' inserted by scan '{scan_id}'."
                    )
                    stats["inserted"] += 1

                    # Publish New Scheme Event
                    from app.services.notification_engine import notification_engine
                    await notification_engine.publish_event(
                        db,
                        event_type="new_scheme",
                        severity="SUCCESS",
                        title="New Scheme Found",
                        message=f"New scheme '{new_scheme.name}' has been found and added to the registry.",
                        details={"scheme_id": new_scheme.id, "scan_id": scan_id}
                    )

                else:
                    # Case 2: Update Existing Scheme
                    previous_values = {}
                    new_values = {}
                    changed = False

                    # Check for diffs on mutable fields
                    for field in self.MUTABLE_FIELDS:
                        db_val = getattr(scheme, field)
                        new_val = data.get(field)

                        # Standardize lists/JSON checks
                        if isinstance(db_val, list) and isinstance(new_val, list):
                            if sorted(db_val) != sorted(new_val):
                                previous_values[field] = db_val
                                new_values[field] = new_val
                                setattr(scheme, field, new_val)
                                changed = True
                        elif db_val != new_val:
                            # Avoid overwriting with None if there is existing content
                            if new_val is not None or db_val is None:
                                previous_values[field] = db_val
                                new_values[field] = new_val
                                setattr(scheme, field, new_val)
                                changed = True

                    # Update metadata metrics
                    scheme.last_seen = now
                    scheme.last_checked = now
                    scheme.confidence_score = data["confidence_score"]
                    scheme.source_url = data["source_url"]
                    scheme.scan_id = scan_id

                    # Check for withdrawn keywords in page text
                    from app.services.lifecycle_engine import lifecycle_engine
                    is_withdrawn, evidence = lifecycle_engine.detect_withdrawn(item.get("clean_text"), data["source_url"])

                    if is_withdrawn and scheme.status != "withdrawn":
                        await lifecycle_engine.transition_status(
                            db, scheme, "withdrawn", "system", "Withdrawn keywords detected.", evidence, scan_id
                        )
                    elif changed:
                        scheme.version += 1
                        scheme.status = "updated"
                        # Create Update Audit Log
                        audit = SyncAuditLog(
                            operation="UPDATE",
                            scheme_id=scheme.id,
                            previous_values=previous_values,
                            new_values=new_values,
                            user_system="system",
                            details=f"Scheme '{scheme.name}' updated. Version incremented to {scheme.version}."
                        )
                        db.add(audit)

                        # Record version history
                        from app.services.history_engine import history_engine
                        await history_engine.record_version(
                            db, scheme=scheme, change_type="UPDATE", actor="system",
                            reason=f"Scheme '{scheme.name}' updated by scan '{scan_id}'.",
                            prev_vals=previous_values
                        )
                        stats["updated"] += 1

                        # Publish Updated Scheme Event
                        from app.services.notification_engine import notification_engine
                        await notification_engine.publish_event(
                            db,
                            event_type="scheme_updated",
                            severity="INFO",
                            title="Scheme Updated",
                            message=f"Scheme '{scheme.name}' has been modified and updated.",
                            details={"scheme_id": scheme.id, "scan_id": scan_id, "changes": new_values}
                        )
                    else:
                        # Log standard audit trace without version increment
                        audit = SyncAuditLog(
                            operation="IGNORE",
                            scheme_id=scheme.id,
                            previous_values=None,
                            new_values=None,
                            user_system="system",
                            details=f"Scheme '{scheme.name}' matches database values. No changes made."
                        )
                        db.add(audit)

            # 2. Lifecycle Evaluation check
            from app.config import get_settings
            from app.services.lifecycle_engine import lifecycle_engine
            settings = get_settings()
            lc_stats = await lifecycle_engine.evaluate_lifecycle_events(
                db, scan_id, max_missing_scans=settings.inactive_missing_scans_threshold
            )
            stats["deactivated"] = lc_stats["deactivated"]

            # Commit the transaction
            await db.commit()
            logger.info(f"Sync batch completed successfully for scan {scan_id}. {stats}")
            return stats

        except Exception as e:
            await db.rollback()
            logger.error(f"Sync batch transaction failed for scan {scan_id}: {e}", exc_info=True)

            # Register error rollback log
            try:
                from app.database import async_session
                async with async_session() as audit_session:
                    error_audit = SyncAuditLog(
                        operation="ROLLBACK",
                        scheme_id=None,
                        previous_values=None,
                        new_values=None,
                        user_system="system",
                        details=f"Sync run '{scan_id}' failed and rolled back. Error: {str(e)}"
                    )
                    audit_session.add(error_audit)

                    # Publish Sync Failed Event
                    from app.services.notification_engine import notification_engine
                    await notification_engine.publish_event(
                        audit_session,
                        event_type="sync_failed",
                        severity="ERROR",
                        title="Database Synchronization Failed",
                        message=f"Sync run '{scan_id}' failed and rolled back.",
                        details={"error": str(e), "scan_id": scan_id}
                    )
                    await audit_session.commit()
            except Exception as audit_err:
                logger.error(f"Failed to record rollback audit log: {audit_err}")

            stats["status"] = "failed"
            stats["error"] = str(e)
            return stats


# Singleton
sync_engine = SyncEngineService()
