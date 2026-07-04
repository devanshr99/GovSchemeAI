"""
Database migration script for YojanaAI (Phase 3 Government Source Registry).
Creates the `government_sources` table and seeds it with default trusted sources.
"""

import sqlite3
import logging
import uuid
from pathlib import Path
from datetime import datetime
from app.config import get_settings

logger = logging.getLogger("yojana.migrations.v3")
settings = get_settings()


def run_migration_v3():
    """
    Ensures table 'government_sources' exists and loads default trusted seed data.
    """
    logger.info("Starting Phase 3 database migration check...")

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
        # 1. Create table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS government_sources (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                category VARCHAR(100) NOT NULL,
                website_url VARCHAR(1000) UNIQUE NOT NULL,
                rss_url VARCHAR(1000) NULL,
                sitemap_url VARCHAR(1000) NULL,
                state VARCHAR(100) NULL,
                ministry VARCHAR(255) NULL,
                department VARCHAR(255) NULL,
                priority INTEGER DEFAULT 1 NOT NULL,
                is_active BOOLEAN DEFAULT 1 NOT NULL,
                is_verified BOOLEAN DEFAULT 1 NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                notes TEXT NULL
            )
        """)

        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_sources_name ON government_sources (name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_sources_category ON government_sources (category)")

        # 2. Seed initial trusted sources if table is empty
        cursor.execute("SELECT COUNT(*) FROM government_sources")
        count = cursor.fetchone()[0]

        if count == 0:
            logger.info("Seeding initial trusted government sources...")
            default_sources = [
                (
                    str(uuid.uuid4()),
                    "National Portal of India",
                    "Portal",
                    "https://www.india.gov.in",
                    None,
                    None,
                    None,
                    None,
                    None,
                    5,
                    1,
                    1,
                    datetime.utcnow().isoformat(),
                    datetime.utcnow().isoformat(),
                    "Unified portal for single window access to information and services provided by Indian Government."
                ),
                (
                    str(uuid.uuid4()),
                    "MyGov India",
                    "Portal",
                    "https://www.mygov.in",
                    None,
                    None,
                    None,
                    None,
                    None,
                    5,
                    1,
                    1,
                    datetime.utcnow().isoformat(),
                    datetime.utcnow().isoformat(),
                    "Citizen engagement platform of the Government of India."
                ),
                (
                    str(uuid.uuid4()),
                    "Press Information Bureau (PIB)",
                    "Portal",
                    "https://www.pib.gov.in",
                    None,
                    None,
                    None,
                    None,
                    None,
                    4,
                    1,
                    1,
                    datetime.utcnow().isoformat(),
                    datetime.utcnow().isoformat(),
                    "Nodal agency of the Government of India to disseminate information to the print and electronic media."
                ),
                (
                    str(uuid.uuid4()),
                    "Open Government Data (OGD) Platform India",
                    "Portal",
                    "https://www.data.gov.in",
                    None,
                    None,
                    None,
                    None,
                    None,
                    4,
                    1,
                    1,
                    datetime.utcnow().isoformat(),
                    datetime.utcnow().isoformat(),
                    "Platform for supporting Open Data initiative of Government of India."
                )
            ]

            cursor.executemany("""
                INSERT INTO government_sources (
                    id, name, category, website_url, rss_url, sitemap_url,
                    state, ministry, department, priority, is_active, is_verified,
                    created_at, updated_at, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, default_sources)

            logger.info(f"Seeded {len(default_sources)} default trusted sources successfully.")
        else:
            logger.info("Table 'government_sources' already populated. Seeding skipped.")

        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to run migration v3: {e}", exc_info=True)
        raise e
    finally:
        conn.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migration_v3()
