"""
Database migration script for YojanaAI (Phase 9 Version History & Audit).
Creates tables `scheme_versions`, `audit_logs`, and `field_history`.
"""

import sqlite3
import logging
from pathlib import Path
from app.config import get_settings

logger = logging.getLogger("yojana.migrations.v9")
settings = get_settings()


def run_migration_v9():
    """
    Ensures version history and audit log tables exist.
    """
    logger.info("Starting Phase 9 database migration check...")

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

        # 1. Create scheme_versions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scheme_versions (
                id VARCHAR(36) PRIMARY KEY,
                scheme_id VARCHAR(36) NOT NULL,
                version_number INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                created_by VARCHAR(100) DEFAULT 'system' NOT NULL,
                change_reason VARCHAR(500),
                change_type VARCHAR(50) NOT NULL,
                previous_version INTEGER,
                source_url VARCHAR(1000),
                scan_id VARCHAR(50),
                confidence_score REAL,
                scheme_data TEXT NOT NULL,
                FOREIGN KEY (scheme_id) REFERENCES schemes (id) ON DELETE CASCADE
            )
        """)

        # 2. Create audit_logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id VARCHAR(36) PRIMARY KEY,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                operation VARCHAR(100) NOT NULL,
                scheme_id VARCHAR(36),
                version_number INTEGER,
                actor VARCHAR(100) DEFAULT 'system' NOT NULL,
                source VARCHAR(100),
                status VARCHAR(50) DEFAULT 'success' NOT NULL,
                details VARCHAR(1000)
            )
        """)

        # 3. Create field_history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS field_history (
                id VARCHAR(36) PRIMARY KEY,
                scheme_id VARCHAR(36) NOT NULL,
                field_name VARCHAR(100) NOT NULL,
                old_value TEXT,
                new_value TEXT,
                version_number INTEGER NOT NULL,
                modified_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                modified_by VARCHAR(100) DEFAULT 'system' NOT NULL
            )
        """)

        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_scheme_versions_scheme_id ON scheme_versions (scheme_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_timestamp ON audit_logs (timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_operation ON audit_logs (operation)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_field_history_scheme_id ON field_history (scheme_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_field_history_field_name ON field_history (field_name)")

        conn.commit()
        logger.info("[SUCCESS] Migration Phase 9 completed. History and Audit tables verified.")
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to run migration v9: {e}", exc_info=True)
        raise e
    finally:
        conn.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migration_v9()
