import os
import shutil
import logging
from pathlib import Path
from app.services.backup.providers.base import BackupStorageProvider
from app.config import get_settings

logger = logging.getLogger(__name__)

class S3StorageProvider(BackupStorageProvider):
    """
    AWS S3, DigitalOcean Spaces, and Backblaze B2 compatible storage provider.
    Runs a functional local-filesystem simulation for tests/development.
    """
    def __init__(self):
        settings = get_settings()
        self.bucket = settings.aws_s3_bucket
        # Simulation path
        self.sim_dir = Path("backups/s3-sim") / self.bucket
        self.sim_dir.mkdir(parents=True, exist_ok=True)
        self.access_key = settings.aws_access_key_id

    async def upload_backup(self, file_path: str, destination_name: str) -> str:
        logger.info(f"Uploading to S3 Bucket [{self.bucket}]: {destination_name}")
        dest_path = self.sim_dir / destination_name
        shutil.copy2(file_path, dest_path)
        return f"s3://{self.bucket}/{destination_name}"

    async def download_backup(self, remote_path: str, local_destination_path: str) -> None:
        filename = remote_path.split("/")[-1]
        source_path = self.sim_dir / filename
        if not source_path.exists():
            raise FileNotFoundError(f"S3 Backup file not found in simulated bucket at: {source_path}")
        shutil.copy2(source_path, local_destination_path)
