import os
import zipfile
import json
import time
import hashlib
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Tuple

from sqlalchemy import select, delete, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings
from app.database import async_session, Base
from app.models.backup import BackupJob, BackupHistory, RestoreHistory
from app.services.backup.providers.local import LocalStorageProvider
from app.services.backup.providers.s3 import S3StorageProvider
from app.services.backup.providers.gcs import GCSStorageProvider
from app.services.backup.providers.azure import AzureStorageProvider
from app.services.notification_engine import notification_engine

logger = logging.getLogger(__name__)

class BackupRestoreManager:
    """
    Coordinates enterprise-grade backups, file compression, SHA256 checksums,
    retention cleanups, and secure data restores.
    """
    def __init__(self):
        self.settings = get_settings()
        self.temp_dir = Path("backups/temp")
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def _get_provider(self, provider_name: str):
        provider_name = provider_name.lower()
        if provider_name == "s3":
            return S3StorageProvider()
        elif provider_name == "gcs":
            return GCSStorageProvider()
        elif provider_name == "azure":
            return AzureStorageProvider()
        else:
            return LocalStorageProvider()

    def _calculate_sha256(self, file_path: str) -> str:
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    async def run_backup(self, db: AsyncSession, job_name: str, backup_type: str = "manual", targets: List[str] = None) -> BackupHistory:
        """
        Creates a zip archive containing requested backup targets, calculates checksums,
        uploads to the configured storage provider, and records metadata history.
        """
        if not targets:
            targets = ["database", "files", "configs", "logs", "index"]

        start_time = time.perf_counter()
        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"yojana_backup_{backup_type}_{timestamp_str}.zip"
        local_zip_path = self.temp_dir / backup_filename

        history = BackupHistory(
            backup_type=backup_type,
            status="Pending",
            targets=targets
        )
        db.add(history)
        await db.commit()
        await db.refresh(history)

        try:
            with zipfile.ZipFile(local_zip_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
                # 1. Database Backup (Database-agnostic JSON-serializer)
                if "database" in targets:
                    db_json_path = self.temp_dir / "db_export.json"
                    await self._export_database_to_json(db_json_path)
                    zip_file.write(db_json_path, arcname="database/db_export.json")
                    os.remove(db_json_path)

                # 2. Uploaded Files
                if "files" in targets and self.settings.data_dir:
                    data_path = Path(self.settings.data_dir)
                    for root, _, files in os.walk(data_path):
                        # Skip index files to isolate file uploads
                        if "faiss_index" in root:
                            continue
                        for file in files:
                            full_path = Path(root) / file
                            rel_path = full_path.relative_to(data_path)
                            zip_file.write(full_path, arcname=f"files/{rel_path}")

                # 3. Search Index (FAISS)
                if "index" in targets and self.settings.faiss_index_dir:
                    index_path = Path(self.settings.faiss_index_dir)
                    if index_path.exists():
                        for root, _, files in os.walk(index_path):
                            for file in files:
                                full_path = Path(root) / file
                                rel_path = full_path.relative_to(index_path)
                                zip_file.write(full_path, arcname=f"index/{rel_path}")

                # 4. Environment Configurations (Sanitizing secrets)
                if "configs" in targets:
                    env_path = Path(".env")
                    sanitized_lines = []
                    if env_path.exists():
                        with open(env_path, "r", encoding="utf-8") as f:
                            for line in f:
                                if "=" in line:
                                    key, val = line.split("=", 1)
                                    key_lower = key.strip().lower()
                                    if any(secret_word in key_lower for secret_word in ["key", "secret", "password", "token"]):
                                        sanitized_lines.append(f"{key.strip()}=[REDACTED]\n")
                                    else:
                                        sanitized_lines.append(line)
                                else:
                                    sanitized_lines.append(line)
                    else:
                        # Fallback: Generate sanitized configuration from active settings (e.g. in CI environments)
                        for key, val in self.settings.model_dump().items():
                            key_upper = key.upper()
                            if any(secret_word in key.lower() for secret_word in ["key", "secret", "password", "token"]):
                                sanitized_lines.append(f"{key_upper}=[REDACTED]\n")
                            else:
                                sanitized_lines.append(f"{key_upper}={val}\n")

                    config_temp = self.temp_dir / "sanitized.env"
                    with open(config_temp, "w", encoding="utf-8") as f:
                        f.writelines(sanitized_lines)
                    zip_file.write(config_temp, arcname="configs/sanitized.env")
                    os.remove(config_temp)

                # 5. Logs (Memory Logs Buffer)
                if "logs" in targets:
                    from app.routers.dashboard import memory_log_handler
                    logs = list(memory_log_handler.log_buffer)
                    logs_temp = self.temp_dir / "recent_logs.json"
                    with open(logs_temp, "w", encoding="utf-8") as f:
                        json.dump(logs, f, indent=2)
                    zip_file.write(logs_temp, arcname="logs/recent_logs.json")
                    os.remove(logs_temp)

            # Check zip size and checksum
            size_bytes = os.path.getsize(local_zip_path)
            checksum = self._calculate_sha256(str(local_zip_path))

            # Upload to Provider
            provider = self._get_provider(self.settings.backup_storage_provider)
            remote_uri = await provider.upload_backup(str(local_zip_path), backup_filename)

            # Clean up local zip
            os.remove(local_zip_path)

            duration = time.perf_counter() - start_time
            history.status = "Completed"
            history.duration_seconds = round(duration, 2)
            history.size_bytes = size_bytes
            history.checksum = checksum
            history.backup_path = remote_uri
            await db.commit()

            # Run retention cleanup automatically
            await self.cleanup_expired_backups(db)

            logger.info(f"Backup complete: {backup_filename} ({size_bytes} bytes). Checksum: {checksum}")
            return history

        except Exception as e:
            duration = time.perf_counter() - start_time
            history.status = "Failed"
            history.duration_seconds = round(duration, 2)
            history.error_message = str(e)
            await db.commit()

            # Trigger Disaster Alert
            await notification_engine.publish_event(
                db,
                event_type="backup_failed",
                severity="CRITICAL",
                title="Backup Run Failed",
                message=f"Backup job '{job_name}' of type '{backup_type}' failed: {str(e)}",
                details={"job_name": job_name, "error": str(e)}
            )
            logger.error(f"Backup failed: {e}", exc_info=True)
            if local_zip_path.exists():
                os.remove(local_zip_path)
            raise e

    async def run_restore(self, db: AsyncSession, history_id: str, initiated_by: str, target: str = "full") -> RestoreHistory:
        """
        Downloads the backup archive, verifies SHA256 checksum integrity, and restores database and system files.
        """
        start_time = time.perf_counter()
        history_record = await db.get(BackupHistory, history_id)
        if not history_record:
            raise FileNotFoundError(f"Backup history record {history_id} not found.")

        restore_log = RestoreHistory(
            backup_history_id=history_id,
            target=target,
            status="Pending",
            initiated_by=initiated_by
        )
        db.add(restore_log)
        await db.commit()
        await db.refresh(restore_log)

        local_zip_path = self.temp_dir / f"restore_{history_id}.zip"

        try:
            # Download file
            provider = self._get_provider(self.settings.backup_storage_provider)
            await provider.download_backup(history_record.backup_path, str(local_zip_path))

            # Verify integrity
            current_checksum = self._calculate_sha256(str(local_zip_path))
            if current_checksum != history_record.checksum:
                # Mark corrupted in backup history
                history_record.status = "Corrupted"
                await db.commit()
                raise ValueError(f"Backup checksum verification failed! Expected: {history_record.checksum}, got: {current_checksum}")

            with zipfile.ZipFile(local_zip_path, "r") as zip_ref:
                # 1. Restore database (JSON table injection)
                if target in ("full", "database") and "database/db_export.json" in zip_ref.namelist():
                    db_json_data = json.loads(zip_ref.read("database/db_export.json").decode("utf-8"))
                    await self._import_database_from_json(db, db_json_data)

                # 2. Restore file uploads
                if target in ("full", "files") and self.settings.data_dir:
                    dest_dir = Path(self.settings.data_dir)
                    for member in zip_ref.namelist():
                        if member.startswith("files/"):
                            rel_path = member.replace("files/", "", 1)
                            target_file = dest_dir / rel_path
                            target_file.parent.mkdir(parents=True, exist_ok=True)
                            with open(target_file, "wb") as f:
                                f.write(zip_ref.read(member))

                # 3. Restore Search Index (FAISS)
                if target in ("full", "index") and self.settings.faiss_index_dir:
                    dest_dir = Path(self.settings.faiss_index_dir)
                    dest_dir.mkdir(parents=True, exist_ok=True)
                    for member in zip_ref.namelist():
                        if member.startswith("index/"):
                            rel_path = member.replace("index/", "", 1)
                            target_file = dest_dir / rel_path
                            target_file.parent.mkdir(parents=True, exist_ok=True)
                            with open(target_file, "wb") as f:
                                f.write(zip_ref.read(member))

            os.remove(local_zip_path)
            duration = time.perf_counter() - start_time
            restore_log.status = "Completed"
            restore_log.duration_seconds = round(duration, 2)
            await db.commit()

            logger.info(f"Restore run {history_id} completed successfully for target '{target}'.")
            return restore_log

        except Exception as e:
            duration = time.perf_counter() - start_time
            restore_log.status = "Failed"
            restore_log.duration_seconds = round(duration, 2)
            restore_log.error_message = str(e)
            await db.commit()

            # Trigger Restore Failure Alert
            await notification_engine.publish_event(
                db,
                event_type="restore_failed",
                severity="CRITICAL",
                title="Restore Recovery Failed",
                message=f"Database restore from backup {history_id} failed: {str(e)}",
                details={"backup_id": history_id, "error": str(e)}
            )
            logger.error(f"Restore failed: {e}", exc_info=True)
            if local_zip_path.exists():
                os.remove(local_zip_path)
            raise e

    async def cleanup_expired_backups(self, db: AsyncSession):
        """
        Deletes local and remote backups that have exceeded their retention schedules.
        """
        now = datetime.utcnow()
        # Fetch completed backups
        stmt = select(BackupHistory).where(BackupHistory.status == "Completed")
        res = await db.execute(stmt)
        histories = res.scalars().all()

        for h in histories:
            days_limit = self.settings.backup_retention_days
            # Adjust retention based on type if needed
            if h.backup_type == "daily":
                days_limit = 30
            elif h.backup_type == "weekly":
                days_limit = 84  # 12 weeks
            elif h.backup_type == "monthly":
                days_limit = 365  # 12 months

            expiration_date = h.created_at + timedelta(days=days_limit)
            if now > expiration_date:
                logger.info(f"Deleting expired backup: {h.backup_path}")
                try:
                    # Parse filename and delete remote
                    filename = h.backup_path.split("/")[-1]
                    provider = self._get_provider(self.settings.backup_storage_provider)
                    # For S3/GCS simulation, delete the simulated file
                    sim_file = provider.sim_dir / filename if hasattr(provider, "sim_dir") else Path(h.backup_path)
                    if sim_file.exists():
                        os.remove(sim_file)
                    
                    # Update status
                    h.status = "Deleted"
                    db.add(h)
                except Exception as ex:
                    logger.warning(f"Failed to delete backup file {h.backup_path}: {ex}")

        await db.commit()

    async def _export_database_to_json(self, export_path: Path):
        """
        Database-agnostic exporter. Serializes all table rows into a structured JSON dictionary.
        """
        export_data = {}
        async with async_session() as session:
            for table_name, table in Base.metadata.tables.items():
                # Skip backup metadata logs to prevent recursive backups size bloating
                if table_name in ("backup_history", "restore_history", "disaster_events", "failover_events"):
                    continue
                # Select all rows
                stmt = select(table)
                res = await session.execute(stmt)
                rows = res.fetchall()
                
                table_rows = []
                for row in rows:
                    row_dict = {}
                    # Map values
                    for col in table.columns:
                        val = getattr(row, col.name)
                        if isinstance(val, datetime):
                            val = val.isoformat()
                        row_dict[col.name] = val
                    table_rows.append(row_dict)
                export_data[table_name] = table_rows

        with open(export_path, "w", encoding="utf-8") as f:
            json.dump(export_data, f, indent=2)

    async def _import_database_from_json(self, db: AsyncSession, data: Dict[str, List[Dict[str, Any]]]):
        """
        Database-agnostic importer. Disables foreign keys, deletes rows, and bulk-inserts JSON payloads.
        """
        # SQLite vs Postgres check
        is_sqlite = "sqlite" in str(db.bind.url) if db.bind else True

        # Disable foreign keys
        if is_sqlite:
            await db.execute(text("PRAGMA foreign_keys = OFF;"))
        else:
            await db.execute(text("SET CONSTRAINTS ALL DEFERRED;"))

        try:
            # Drop/Delete current tables in reverse metadata order
            for table in reversed(Base.metadata.sorted_tables):
                if table.name in ("backup_jobs", "backup_history", "restore_history", "disaster_events", "failover_events"):
                    continue
                if is_sqlite:
                    await db.execute(text(f"DELETE FROM {table.name};"))  # nosec B608
                else:
                    await db.execute(text(f"TRUNCATE TABLE {table.name} CASCADE;"))  # nosec B608

            # Populate tables in forward metadata order
            for table in Base.metadata.sorted_tables:
                if table.name not in data:
                    continue
                rows = data[table.name]
                for r in rows:
                    # Reconstruct datetime objects
                    insert_vals = {}
                    for col in table.columns:
                        val = r.get(col.name)
                        if val is not None and isinstance(val, str) and col.type.python_type == datetime:
                            try:
                                val = datetime.fromisoformat(val)
                            except ValueError:
                                pass
                        insert_vals[col.name] = val
                    await db.execute(table.insert().values(**insert_vals))

            await db.commit()

        finally:
            # Re-enable foreign keys
            if is_sqlite:
                await db.execute(text("PRAGMA foreign_keys = ON;"))

backup_restore_manager = BackupRestoreManager()
