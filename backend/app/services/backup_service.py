
import os
import asyncio
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict
from app.core.config import settings
from app.core.logging import logger

class BackupService:
    def __init__(self):
        self.backup_dir = Path("/app/backups")
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    async def create_backup(self, created_by_id: Optional[str] = None) -> Dict:
        """
        Execute pg_dump to create a compressed database snapshot asynchronously.
        Prevents blocking the FastAPI/Celery event loop.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"kitsu_backup_{timestamp}.sql.gz"
        filepath = self.backup_dir / filename

        # Construct pg_dump command
        db_url = str(settings.DATABASE_URL)
        standard_url = db_url.replace("+asyncpg", "")

        cmd = f"pg_dump {standard_url} | gzip > {filepath}"
        
        try:
            logger.info("Backup Engine: Initiating snapshot", filename=filename)
            
            # Using asyncio to prevent event loop blocking
            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                error_msg = stderr.decode()
                logger.error("Backup Engine: Execution Fault", error=error_msg)
                raise Exception(f"Database dump failed: {error_msg}")
            
            size = filepath.stat().st_size
            logger.info("Backup Engine: Snapshot successful", size_bytes=size)

            return {
                "filename": filename,
                "size_bytes": size,
                "storage_path": str(filepath),
                "type": "manual" if created_by_id else "automatic",
                "status": "completed"
            }
        except Exception as e:
            logger.error("Backup Engine: Critical System Failure", error=str(e))
            if filepath.exists():
                filepath.unlink()
            raise

    def list_backups(self) -> List[Dict]:
        backups = []
        for f in self.backup_dir.glob("*.sql.gz"):
            stat = f.stat()
            backups.append({
                "filename": f.name,
                "size": stat.st_size,
                "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat()
            })
        return sorted(backups, key=lambda x: x["created_at"], reverse=True)

backup_service = BackupService()
