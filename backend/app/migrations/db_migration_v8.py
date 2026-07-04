"""
Database migration script for YojanaAI (Phase 8 Database Synchronization).
Adds `scan_id` to `schemes` table and creates `sync_audit_logs` table.
"""

import sqlite3
import logging
from pathlib import Path
from app.config import get_settings

logger = logging.getLogger("yojana.migrations.v8")
settings = get_settings()


def run_migration_v8():
    """
    Ensures Schemes has scan_id column and creates table 'sync_audit_logs' if missing.
    """
    logger.info("Starting Phase 8 database migration check...")

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
        # 1. Add scan_id column to schemes if not exists
        cursor.execute("PRAGMA table_info(schemes)")
        columns = [row[1] for row in cursor.fetchall()]

        if "scan_id" not in columns:
            logger.info("Column 'scan_id' not found in table 'schemes'. Adding via ALTER TABLE...")
            cursor.execute("ALTER TABLE schemes ADD COLUMN scan_id VARCHAR(50)")
            logger.info("Column 'scan_id' successfully added to 'schemes'.")

        # 2. Create sync_audit_logs table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sync_audit_logs (
                id VARCHAR(36) PRIMARY KEY,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                operation VARCHAR(50) NOT NULL,
                scheme_id VARCHAR(36),
                previous_values TEXT,
                new_values TEXT,
                user_system VARCHAR(50) DEFAULT 'system' NOT NULL,
                details TEXT
            )
        """)

        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_sync_audit_logs_timestamp ON sync_audit_logs (timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_sync_audit_logs_operation ON sync_audit_logs (operation)")

        conn.commit()
        logger.info("[SUCCESS] Migration Phase 8 completed. schemes scan_id and sync_audit_logs verified.")
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to run migration v8: {e}", exc_info=True)
        raise e
    finally:
        conn.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migration_v8()
