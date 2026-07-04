"""
Database migration script for YojanaAI (Phase 15 Intelligent Search & Indexing Engine).
Creates the `search_history` table and optimization indexes.
"""

import sqlite3
import logging
from pathlib import Path
from app.config import get_settings

logger = logging.getLogger("yojana.migrations.v15")
settings = get_settings()


def run_migration_v15():
    """
    Ensures table 'search_history' exists and indexes are built.
    """
    logger.info("Starting Phase 15 database migration check...")

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
        # 1. Create search_history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS search_history (
                id TEXT(36) PRIMARY KEY,
                query TEXT(255) NOT NULL,
                timestamp DATETIME NOT NULL,
                results_count INTEGER NOT NULL DEFAULT 0,
                execution_time_ms REAL NOT NULL DEFAULT 0.0,
                filters_used TEXT NOT NULL DEFAULT '{}'
            )
        """)
        logger.info("Checked/created table 'search_history'")

        # 2. Create search performance index columns
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history (query)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_search_history_timestamp ON search_history (timestamp)")

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_schemes_name ON schemes (name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_schemes_ministry ON schemes (ministry)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_schemes_department ON schemes (department)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_schemes_state_code ON schemes (state_code)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_schemes_status ON schemes (status)")
        logger.info("Checked/created performance indexes on search_history and schemes tables.")

        conn.commit()
        logger.info("Phase 15 database migrations completed successfully.")
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to complete database migration Phase 15: {e}")
        raise e
    finally:
        conn.close()
