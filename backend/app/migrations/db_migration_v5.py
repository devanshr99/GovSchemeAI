"""
Database migration script for YojanaAI (Phase 5 AI Processing Pipeline).
Creates the `crawl_extractions` table and registers indexing.
"""

import sqlite3
import logging
from pathlib import Path
from app.config import get_settings

logger = logging.getLogger("yojana.migrations.v5")
settings = get_settings()


def run_migration_v5():
    """
    Ensures table 'crawl_extractions' exists for storing Phase 5 AI structure assets.
    """
    logger.info("Starting Phase 5 database migration check...")

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

        # 1. Create table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS crawl_extractions (
                id VARCHAR(36) PRIMARY KEY,
                queue_item_id VARCHAR(36) NOT NULL,
                extracted_data TEXT NOT NULL,
                validation_report TEXT NOT NULL,
                duplicate_report TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                FOREIGN KEY (queue_item_id) REFERENCES crawl_queue (id) ON DELETE CASCADE
            )
        """)

        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_crawl_extractions_queue_item_id ON crawl_extractions (queue_item_id)")

        conn.commit()
        logger.info("[SUCCESS] Migration Phase 5 completed. crawl_extractions table verified.")
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to run migration v5: {e}", exc_info=True)
        raise e
    finally:
        conn.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migration_v5()
