import os
import shutil
from pathlib import Path
from app.services.backup.providers.base import BackupStorageProvider

class LocalStorageProvider(BackupStorageProvider):
    """
    Saves backups locally in a configured storage folder.
    """
    def __init__(self, backup_dir: str = "backups"):
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    async def upload_backup(self, file_path: str, destination_name: str) -> str:
        dest_path = self.backup_dir / destination_name
        # Copy file synchronously to local backup directory
        shutil.copy2(file_path, dest_path)
        return str(dest_path.resolve())

    async def download_backup(self, remote_path: str, local_destination_path: str) -> None:
        if not os.path.exists(remote_path):
            raise FileNotFoundError(f"Local backup file not found at: {remote_path}")
        shutil.copy2(remote_path, local_destination_path)
