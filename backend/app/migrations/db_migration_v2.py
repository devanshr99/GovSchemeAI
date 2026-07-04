"""
Database migration script for YojanaAI (Phase 2 Database Extension).
Adds new columns and indexes to the existing `schemes` table safely.
Handles SQLite's constant-default limitations by using UPDATE statements for defaults.
"""

import os
import sqlite3
import logging
from pathlib import Path
from app.config import get_settings

logger = logging.getLogger("yojana.migrations")
settings = get_settings()


def run_migration_v2():
    """
    Checks the schemes table schema and appends missing columns and indexes.
    Works synchronously to ensure safe SQLite transactions on startup.
    """
    logger.info("Starting database migration check...")

    # Parse sqlite database path from URL
    db_url = settings.database_url
    if "sqlite" not in db_url:
        logger.warning("Non-SQLite database configured. Automatic synchronous migration skipped.")
        return

    # Extract SQLite path
    clean_path = db_url.split("///")[-1]

    # Resolve absolute path relative to base directory
    base_dir = Path(__file__).parent.parent.parent
    db_path = base_dir / clean_path
    db_path = db_path.resolve()

    if not db_path.exists():
        logger.warning(f"Database file not found at {db_path}. Migration will run after next init.")
        return

    logger.info(f"Connecting to database file: {db_path}")
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    try:
        # Get existing columns
        cursor.execute("PRAGMA table_info(schemes)")
        columns = [row[1] for row in cursor.fetchall()]

        if not columns:
            logger.warning("Table 'schemes' does not exist yet. create_all will run first.")
            conn.close()
            return

        alterations = []

        # 1. Add status
        if "status" not in columns:
            cursor.execute("ALTER TABLE schemes ADD COLUMN status VARCHAR(50) DEFAULT 'active'")
            alterations.append("status")

        # 2. Add last_seen (nullable, then update)
        if "last_seen" not in columns:
            cursor.execute("ALTER TABLE schemes ADD COLUMN last_seen DATETIME")
            cursor.execute("UPDATE schemes SET last_seen = datetime('now') WHERE last_seen IS NULL")
            alterations.append("last_seen")

        # 3. Add last_checked (nullable, then update)
        if "last_checked" not in columns:
            cursor.execute("ALTER TABLE schemes ADD COLUMN last_checked DATETIME")
            cursor.execute("UPDATE schemes SET last_checked = datetime('now') WHERE last_checked IS NULL")
            alterations.append("last_checked")

        # 4. Add version
        if "version" not in columns:
            cursor.execute("ALTER TABLE schemes ADD COLUMN version INTEGER DEFAULT 1")
            alterations.append("version")

        # 5. Add source_url
        if "source_url" not in columns:
            cursor.execute("ALTER TABLE schemes ADD COLUMN source_url VARCHAR(1000)")
            alterations.append("source_url")

        # 6. Add confidence_score
        if "confidence_score" not in columns:
            cursor.execute("ALTER TABLE schemes ADD COLUMN confidence_score FLOAT DEFAULT 1.0")
            alterations.append("confidence_score")

        # 7. Add updated_at (nullable, then update)
        if "updated_at" not in columns:
            cursor.execute("ALTER TABLE schemes ADD COLUMN updated_at DATETIME")
            cursor.execute("UPDATE schemes SET updated_at = datetime('now') WHERE updated_at IS NULL")
            alterations.append("updated_at")

        # Create indexes for efficient searching
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_schemes_status ON schemes (status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_schemes_last_seen ON schemes (last_seen)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_schemes_last_checked ON schemes (last_checked)")

        conn.commit()

        if alterations:
            logger.info(f"[SUCCESS] Migration completed. Added fields: {', '.join(alterations)}")
        else:
            logger.info("[OK] Database schema is up-to-date. No changes needed.")

    except Exception as e:
        conn.rollback()
        logger.error(f"[ERROR] Database migration failed: {e}", exc_info=True)
        raise e
    finally:
        conn.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migration_v2()
