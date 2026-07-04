"""
Scheme Lifecycle Management Engine (Phase 10).
Performs automatic lifecycle evaluations: deactivations based on consecutive missing scans thresholds,
expired deadlines checks, and withdrawn keywords scanning.
"""

import re
import logging
from datetime import datetime, date
from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.scheme import Scheme
from app.models.lifecycle import SchemeLifecycle, SchemeStatusHistory
from app.services.history_engine import history_engine

logger = logging.getLogger("yojana.crawler.lifecycle")


class LifecycleManagerService:
    """
    Evaluates expiration dates, scans text keywords for withdrawals, increments missing scans,
    and logs status changes.
    """

    WITHDRAWN_KEYWORDS = [
        r"\bwithdrawn\b",
        r"\bdiscontinued\b",
        r"\bclosed\b",
        r"\bno longer available\b",
        r"\bterminated\b",
        r"\bclosed permanently\b",
    ]

    def detect_withdrawn(self, clean_text: str, url: str) -> Tuple[bool, Optional[str]]:
        """
        Scans cleaned text looking for discontinuation phrases.
        Returns: Tuple[is_withdrawn, evidence_sentence]
        """
        if not clean_text:
            return False, None

        # Split text into lines/sentences to extract context
        sentences = re.split(r"[.!?\n]", clean_text)
        for keyword in self.WITHDRAWN_KEYWORDS:
            pattern = re.compile(keyword, re.IGNORECASE)
            for sentence in sentences:
                if pattern.search(sentence):
                    evidence = f"Matched keyword '{keyword}' in sentence: '{sentence.strip()}' (Source: {url})"
                    logger.info(f"Discontinuation evidence found: {evidence}")
                    return True, evidence

        return False, None

    async def transition_status(
        self,
        db: AsyncSession,
        scheme: Scheme,
        new_status: str,
        actor: str,
        reason: str,
        evidence: Optional[str] = None,
        scan_id: Optional[str] = None
    ):
        """Transitions a scheme status and logs the event in SchemeStatusHistory and Version history."""
        old_status = scheme.status
        if old_status == new_status:
            return

        logger.info(f"Transitioning Scheme {scheme.id[:8]} status: {old_status} -> {new_status} | Reason: {reason}")

        # Update production scheme status
        scheme.status = new_status
        if new_status in ("inactive", "expired", "withdrawn"):
            scheme.is_active = False
        elif new_status == "active":
            scheme.is_active = True

        scheme.version += 1
        scheme.last_checked = datetime.utcnow()

        # 1. Create SchemeStatusHistory entry
        history_entry = SchemeStatusHistory(
            scheme_id=scheme.id,
            old_status=old_status,
            new_status=new_status,
            changed_by=actor,
            reason=reason,
            evidence_url=evidence,
            scan_id=scan_id
        )
        db.add(history_entry)

        # 2. Record version snapshot via HistoryEngine
        change_map = {
            "inactive": "DEACTIVATE",
            "expired": "UPDATE",
            "withdrawn": "DEACTIVATE",
            "active": "UPDATE"
        }
        change_type = change_map.get(new_status, "UPDATE")

        prev_vals = {"status": old_status, "is_active": not scheme.is_active}
        await history_engine.record_version(
            db,
            scheme=scheme,
            change_type=change_type,
            actor=actor,
            reason=reason,
            prev_vals=prev_vals
        )

        # Publish transitions event notifications
        from app.services.notification_engine import notification_engine
        if new_status == "inactive":
            await notification_engine.publish_event(
                db,
                event_type="scheme_inactive",
                severity="WARNING",
                title="Scheme Marked Inactive",
                message=f"Scheme '{scheme.name}' has been marked inactive because it was missing in consecutive scans.",
                details={"scheme_id": scheme.id, "reason": reason}
            )
        elif new_status == "withdrawn":
            await notification_engine.publish_event(
                db,
                event_type="scheme_withdrawn",
                severity="CRITICAL",
                title="Scheme Withdrawn",
                message=f"Scheme '{scheme.name}' has been explicitly marked as Withdrawn/Discontinued.",
                details={"scheme_id": scheme.id, "evidence": evidence}
            )
        elif new_status == "expired":
            await notification_engine.publish_event(
                db,
                event_type="scheme_expired",
                severity="WARNING",
                title="Scheme Expired",
                message=f"Scheme '{scheme.name}' has reached its deadline date and is marked expired.",
                details={"scheme_id": scheme.id, "deadline": str(scheme.deadline)}
            )

    async def evaluate_lifecycle_events(
        self, db: AsyncSession, scan_id: str, max_missing_scans: int = 5
    ) -> Dict[str, Any]:
        """
        Core evaluations checker:
        1. Checks expired deadlines (date > deadline).
        2. Counts consecutive missing scans for active crawl-sourced schemes, deactivating at the threshold limit.
        """
        now_dt = datetime.utcnow()
        now_date = date.today()
        stats = {"expired": 0, "deactivated": 0}

        # 1. Check Expired schemes
        # Schemes with deadline passed should transition to expired
        stmt_expired = select(Scheme).where(
            (Scheme.is_active == True) &
            (Scheme.deadline != None) &
            (Scheme.deadline < now_date)
        )
        res_expired = await db.execute(stmt_expired)
        expired_schemes = res_expired.scalars().all()

        for exp in expired_schemes:
            await self.transition_status(
                db,
                scheme=exp,
                new_status="expired",
                actor="system",
                reason=f"Scheme deadline '{exp.deadline}' has passed. Status marked expired.",
                scan_id=scan_id
            )
            stats["expired"] += 1

        # 2. Inactive / Consecutive missing scans check
        # Get all active crawl-sourced schemes
        stmt_active = select(Scheme).where(
            (Scheme.is_active == True) &
            (Scheme.source_url != None)
        )
        res_active = await db.execute(stmt_active)
        active_schemes = res_active.scalars().all()

        for active in active_schemes:
            # Check lifecycle record
            stmt_lc = select(SchemeLifecycle).where(SchemeLifecycle.scheme_id == active.id)
            res_lc = await db.execute(stmt_lc)
            lifecycle = res_lc.scalars().first()

            if not lifecycle:
                lifecycle = SchemeLifecycle(
                    scheme_id=active.id,
                    consecutive_missing_scans=0,
                    first_seen=now_dt,
                    last_seen=now_dt,
                    last_checked=now_dt
                )
                db.add(lifecycle)
                await db.flush()

            # Update checked timestamp
            lifecycle.last_checked = now_dt

            # If the scheme matches current scan, it was seen! Reset missing counter.
            if active.scan_id == scan_id:
                lifecycle.consecutive_missing_scans = 0
                lifecycle.last_seen = now_dt
            else:
                # Missing from this scan run. Increment counter.
                lifecycle.consecutive_missing_scans += 1
                logger.warning(
                    f"Scheme '{active.name}' missing from scan '{scan_id}'. "
                    f"Consecutive missing scans: {lifecycle.consecutive_missing_scans}/{max_missing_scans}"
                )

                if lifecycle.consecutive_missing_scans >= max_missing_scans:
                    lifecycle.inactive_since = now_dt
                    await self.transition_status(
                        db,
                        scheme=active,
                        new_status="inactive",
                        actor="system",
                        reason=f"Scheme missing for {lifecycle.consecutive_missing_scans} consecutive scans. Deactivated.",
                        scan_id=scan_id
                    )
                    stats["deactivated"] += 1

        return stats


# Singleton
lifecycle_engine = LifecycleManagerService()
