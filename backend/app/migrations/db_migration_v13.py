import sqlite3
import logging
from pathlib import Path
from app.config import get_settings

logger = logging.getLogger("yojana.migrations.v13")
settings = get_settings()

def run_migration_v13():
    """
    Ensures notifications and notification_logs tables exist.
    """
    logger.info("Starting Phase 13 database migration check...")

    db_url = settings.database_url
    if "sqlite" not in db_url:
        logger.warning("Non-SQLite database configured. Skip automatic migration check.")
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
        cursor.execute("PRAGMA foreign_keys = ON")

        # 1. Create notifications table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id VARCHAR(36) PRIMARY KEY,
                event_type VARCHAR(100) NOT NULL,
                severity VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message VARCHAR(1000) NOT NULL,
                details TEXT,  -- JSON payload
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
            )
        """)

        # 2. Create notification_logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notification_logs (
                id VARCHAR(36) PRIMARY KEY,
                notification_id VARCHAR(36) NOT NULL,
                channel VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL,
                delivered_at DATETIME,
                error_message VARCHAR(1000),
                retry_count INTEGER NOT NULL,
                FOREIGN KEY (notification_id) REFERENCES notifications (id) ON DELETE CASCADE
            )
        """)

        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_notifications_event_type ON notifications (event_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications (created_at)")

        conn.commit()
        logger.info("[SUCCESS] Migration Phase 13 completed. Notification tables verified.")
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to run migration v13: {e}", exc_info=True)
        raise e
    finally:
        conn.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migration_v13()
