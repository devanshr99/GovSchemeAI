"""
Database migration script for YojanaAI (Phase 10 Scheme Lifecycle Management).
Creates tables `scheme_lifecycles` and `scheme_status_history`.
"""

import sqlite3
import logging
from pathlib import Path
from app.config import get_settings

logger = logging.getLogger("yojana.migrations.v10")
settings = get_settings()


def run_migration_v10():
    """
    Ensures scheme lifecycle and status history tables exist.
    """
    logger.info("Starting Phase 10 database migration check...")

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

        # 1. Create scheme_lifecycles table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scheme_lifecycles (
                id VARCHAR(36) PRIMARY KEY,
                scheme_id VARCHAR(36) NOT NULL UNIQUE,
                consecutive_missing_scans INTEGER DEFAULT 0 NOT NULL,
                inactive_since DATETIME,
                first_seen DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                last_checked DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                FOREIGN KEY (scheme_id) REFERENCES schemes (id) ON DELETE CASCADE
            )
        """)

        # 2. Create scheme_status_history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scheme_status_history (
                id VARCHAR(36) PRIMARY KEY,
                scheme_id VARCHAR(36) NOT NULL,
                old_status VARCHAR(50),
                new_status VARCHAR(50) NOT NULL,
                changed_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                changed_by VARCHAR(100) DEFAULT 'system' NOT NULL,
                reason VARCHAR(500),
                evidence_url VARCHAR(1000),
                scan_id VARCHAR(50),
                FOREIGN KEY (scheme_id) REFERENCES schemes (id) ON DELETE CASCADE
            )
        """)

        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_scheme_lifecycles_scheme_id ON scheme_lifecycles (scheme_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_scheme_status_history_scheme_id ON scheme_status_history (scheme_id)")

        conn.commit()
        logger.info("[SUCCESS] Migration Phase 10 completed. Lifecycle tables verified.")
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to run migration v10: {e}", exc_info=True)
        raise e
    finally:
        conn.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migration_v10()
