import os
import shutil
import logging
from pathlib import Path
from app.services.backup.providers.base import BackupStorageProvider
from app.config import get_settings

logger = logging.getLogger(__name__)

class GCSStorageProvider(BackupStorageProvider):
    """
    Google Cloud Storage provider.
    Runs a functional local-filesystem simulation for tests/development.
    """
    def __init__(self):
        settings = get_settings()
        self.bucket = settings.gcs_bucket
        # Simulation path
        self.sim_dir = Path("backups/gcs-sim") / self.bucket
        self.sim_dir.mkdir(parents=True, exist_ok=True)

    async def upload_backup(self, file_path: str, destination_name: str) -> str:
        logger.info(f"Uploading to GCS Bucket [{self.bucket}]: {destination_name}")
        dest_path = self.sim_dir / destination_name
        shutil.copy2(file_path, dest_path)
        return f"gs://{self.bucket}/{destination_name}"

    async def download_backup(self, remote_path: str, local_destination_path: str) -> None:
        filename = remote_path.split("/")[-1]
        source_path = self.sim_dir / filename
        if not source_path.exists():
            raise FileNotFoundError(f"GCS Backup file not found in simulated bucket at: {source_path}")
        shutil.copy2(source_path, local_destination_path)
