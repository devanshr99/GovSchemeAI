import sqlite3
import logging
from pathlib import Path
from app.config import get_settings

logger = logging.getLogger("yojana.migrations.v11")
settings = get_settings()

def run_migration_v11():
    """
    Ensures scheduler tables exist.
    """
    logger.info("Starting Phase 11 database migration check...")

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

        # 1. Create scheduler_jobs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scheduler_jobs (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                job_type VARCHAR(50) NOT NULL,
                cron_expression VARCHAR(100),
                next_run_time DATETIME,
                status VARCHAR(50) NOT NULL,
                max_retries INTEGER NOT NULL,
                retry_delay INTEGER NOT NULL,
                timeout_seconds INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
            )
        """)

        # 2. Create scheduler_history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scheduler_history (
                id VARCHAR(36) PRIMARY KEY,
                job_id VARCHAR(36),
                status VARCHAR(50) NOT NULL,
                triggered_by VARCHAR(100) NOT NULL,
                started_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                completed_at DATETIME,
                duration_seconds FLOAT,
                modules_executed TEXT NOT NULL,  -- JSON string/text in SQLite
                errors TEXT NOT NULL,  -- JSON string/text in SQLite
                retry_count INTEGER NOT NULL,
                FOREIGN KEY (job_id) REFERENCES scheduler_jobs (id) ON DELETE CASCADE
            )
        """)

        # Create indexes
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_scheduler_jobs_name ON scheduler_jobs (name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_scheduler_history_job_id ON scheduler_history (job_id)")

        conn.commit()
        logger.info("[SUCCESS] Migration Phase 11 completed. Scheduler tables verified.")
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to run migration v11: {e}", exc_info=True)
        raise e
    finally:
        conn.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migration_v11()
