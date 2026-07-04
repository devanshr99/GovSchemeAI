from abc import ABC, abstractmethod

class BackupStorageProvider(ABC):
    """
    Abstract Base Class for backup storage drivers.
    """
    @abstractmethod
    async def upload_backup(self, file_path: str, destination_name: str) -> str:
        """
        Upload local file to destination storage.
        Returns the public/access path or URI.
        """
        pass

    @abstractmethod
    async def download_backup(self, remote_path: str, local_destination_path: str) -> None:
        """
        Download backup file from remote storage to local filesystem.
        """
        pass
