"""
Database migration script for YojanaAI (Phase 16 Analytics & Reporting Engine).
Creates the `analytics_reports` table.
"""

import sqlite3
import logging
from pathlib import Path
from app.config import get_settings

logger = logging.getLogger("yojana.migrations.v16")
settings = get_settings()


def run_migration_v16():
    """
    Ensures table 'analytics_reports' exists in SQLite.
    """
    logger.info("Starting Phase 16 database migration check...")

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
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analytics_reports (
                id TEXT(36) PRIMARY KEY,
                report_type TEXT(50) NOT NULL,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                created_at DATETIME NOT NULL,
                summary_data TEXT NOT NULL
            )
        """)
        logger.info("Checked/created table 'analytics_reports'")

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analytics_reports_created_at ON analytics_reports (created_at)")
        conn.commit()
        logger.info("Phase 16 database migrations completed successfully.")
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to complete database migration Phase 16: {e}")
        raise e
    finally:
        conn.close()
