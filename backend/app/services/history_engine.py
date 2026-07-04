"""
Version History & Rollback Engine (Phase 9).
Manages SchemeVersion logs, FieldHistory changes tracking, AuditLogs entries,
and Rollback capability with comparison previews.
Operates transactionally.
"""

import logging
from datetime import datetime, date
from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.scheme import Scheme
from app.models.history import SchemeVersion, AuditLog, FieldHistory

logger = logging.getLogger("yojana.crawler.history")


class HistoryEngineService:
    """
    Manages recording scheme states, checking versions previews, and performing rollbacks.
    """

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
        "is_active",
        "launched_date",
    ]

    def _serialize_scheme(self, scheme: Scheme) -> Dict[str, Any]:
        """Serializes current mutable fields of a Scheme object into JSON-compatible values."""
        data = {}
        for field in self.MUTABLE_FIELDS:
            val = getattr(scheme, field, None)
            if isinstance(val, date):
                data[field] = val.isoformat()
            else:
                data[field] = val
        return data

    async def record_version(
        self,
        db: AsyncSession,
        scheme: Scheme,
        change_type: str,
        actor: str,
        reason: Optional[str] = None,
        prev_vals: Optional[Dict[str, Any]] = None
    ) -> SchemeVersion:
        """
        Records the current state of a Scheme in SchemeVersion, log field changes, and create an audit log.
        """
        current_data = self._serialize_scheme(scheme)

        # 1. Create SchemeVersion
        version = SchemeVersion(
            scheme_id=scheme.id,
            version_number=scheme.version,
            created_by=actor,
            change_reason=reason,
            change_type=change_type,
            previous_version=scheme.version - 1 if scheme.version > 1 else None,
            source_url=scheme.source_url,
            scan_id=scheme.scan_id,
            confidence_score=scheme.confidence_score,
            scheme_data=current_data
        )
        db.add(version)

        # 2. Log changed fields in FieldHistory
        if prev_vals:
            for field, old_val in prev_vals.items():
                new_val = current_data.get(field)
                if isinstance(old_val, date):
                    old_val = old_val.isoformat()
                if isinstance(new_val, date):
                    new_val = new_val.isoformat()

                if old_val != new_val:
                    field_log = FieldHistory(
                        scheme_id=scheme.id,
                        field_name=field,
                        old_value=old_val,
                        new_value=new_val,
                        version_number=scheme.version,
                        modified_by=actor
                    )
                    db.add(field_log)

        # 3. Create AuditLog
        operation_map = {
            "INSERT": "Scheme Created",
            "UPDATE": "Scheme Updated",
            "DEACTIVATE": "Scheme Inactivated",
            "ROLLBACK": "Rollback Executed"
        }
        op_text = operation_map.get(change_type, "Scheme Modified")

        audit = AuditLog(
            operation=op_text,
            scheme_id=scheme.id,
            version_number=scheme.version,
            actor=actor,
            source="system" if actor == "system" else "admin",
            status="success",
            details=reason or f"{op_text} to version {scheme.version}."
        )
        db.add(audit)

        return version

    async def preview_rollback(
        self, db: AsyncSession, scheme_id: str, target_version: int
    ) -> Dict[str, Any]:
        """
        Compares the current production Scheme state against a target version snapshot.
        Returns details of added, removed, or modified properties.
        """
        scheme = await db.get(Scheme, scheme_id)
        if not scheme:
            raise ValueError("Scheme not found")

        # Fetch target version
        stmt = select(SchemeVersion).where(
            (SchemeVersion.scheme_id == scheme_id) &
            (SchemeVersion.version_number == target_version)
        )
        res = await db.execute(stmt)
        target = res.scalars().first()
        if not target:
            raise ValueError(f"Target version {target_version} does not exist for this scheme.")

        current_data = self._serialize_scheme(scheme)
        target_data = target.scheme_data

        modified_fields = []
        old_values = {}
        new_values = {}

        for field in self.MUTABLE_FIELDS:
            curr_val = current_data.get(field)
            tgt_val = target_data.get(field)

            if curr_val != tgt_val:
                modified_fields.append(field)
                old_values[field] = curr_val
                new_values[field] = tgt_val

        return {
            "scheme_id": scheme_id,
            "current_version": scheme.version,
            "target_version": target_version,
            "modified_fields": modified_fields,
            "old_values": old_values,
            "new_values": new_values,
            "version_diff": scheme.version - target_version
        }

    async def rollback_to_version(
        self, db: AsyncSession, scheme_id: str, target_version: int, actor: str, reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validates target version, restores all attributes, increments version number,
        and logs version history.
        """
        scheme = await db.get(Scheme, scheme_id)
        if not scheme:
            raise ValueError("Scheme not found")

        # Fetch target version
        stmt = select(SchemeVersion).where(
            (SchemeVersion.scheme_id == scheme_id) &
            (SchemeVersion.version_number == target_version)
        )
        res = await db.execute(stmt)
        target = res.scalars().first()
        if not target:
            raise ValueError(f"Target version {target_version} does not exist.")

        prev_vals = self._serialize_scheme(scheme)
        target_data = target.scheme_data

        # Restore mutable fields
        for field in self.MUTABLE_FIELDS:
            val = target_data.get(field)
            # Handle date conversion back
            if field == "launched_date" and val:
                try:
                    val = datetime.strptime(str(val), "%Y-%m-%d").date()
                except ValueError:
                    val = None
            setattr(scheme, field, val)

        # Increment version and update last checked metrics
        scheme.version += 1
        scheme.last_checked = datetime.utcnow()
        scheme.last_seen = datetime.utcnow()

        # Commit history records
        await self.record_version(
            db,
            scheme=scheme,
            change_type="ROLLBACK",
            actor=actor,
            reason=reason or f"Rollback to version {target_version}.",
            prev_vals=prev_vals
        )

        await db.commit()
        logger.info(f"Scheme {scheme_id} successfully rolled back to version {target_version}. New version: {scheme.version}")

        return {
            "status": "success",
            "scheme_id": scheme_id,
            "new_version": scheme.version,
            "rolled_back_to": target_version
        }


# Singleton
history_engine = HistoryEngineService()
