import sqlite3
import logging
from pathlib import Path
from app.config import get_settings

logger = logging.getLogger("yojana.migrations.v12")
settings = get_settings()

def run_migration_v12():
    """
    Ensures queue_jobs and worker_status tables exist.
    """
    logger.info("Starting Phase 12 database migration check...")

    db_url = settings.database_url
    if "sqlite" not in db_url:
        logger.warning("Non-SQLite database configured. Skip automatic synchronous migration.")
        return

    clean_path = db_url.split("///")[-1]
    base_dir = Path(__file__).parent.parent.parent
    db_path = (base_dir / clean_path).resolve()

    if not db_path.exists():
        logger.warning(f"Database file not found at {db_path}. Will run after next init.")
        return

    logger.info(f"Connecting to database file: {db_path}")
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    try:
        # Enable Foreign Keys support explicitly in SQLite
        cursor.execute("PRAGMA foreign_keys = ON")

        # 1. Create queue_jobs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS queue_jobs (
                id VARCHAR(36) PRIMARY KEY,
                task_name VARCHAR(100) NOT NULL,
                payload TEXT NOT NULL,  -- JSON string/text in SQLite
                priority INTEGER NOT NULL,
                status VARCHAR(50) NOT NULL,
                run_after DATETIME,
                retry_count INTEGER NOT NULL,
                max_retries INTEGER NOT NULL,
                error_message VARCHAR(1000),
                dead_letter_reason VARCHAR(1000),
                worker_id VARCHAR(36),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
            )
        """)

        # 2. Create worker_status table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS worker_status (
                id VARCHAR(36) PRIMARY KEY,
                status VARCHAR(50) NOT NULL,
                last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                running_jobs_count INTEGER NOT NULL,
                completed_jobs_count INTEGER NOT NULL,
                failed_jobs_count INTEGER NOT NULL,
                restart_count INTEGER NOT NULL,
                cpu_usage FLOAT NOT NULL,
                memory_usage FLOAT NOT NULL
            )
        """)

        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_queue_jobs_priority ON queue_jobs (priority)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_queue_jobs_status ON queue_jobs (status)")

        conn.commit()
        logger.info("[SUCCESS] Migration Phase 12 completed. Queue tables verified.")
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to run migration v12: {e}", exc_info=True)
        raise e
    finally:
        conn.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migration_v12()
