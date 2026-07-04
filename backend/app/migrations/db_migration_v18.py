"""
Phase 18 — Performance Optimization Database Migration.
Adds composite indexes for frequently queried column combinations.
"""

import logging
import sqlite3
from app.config import get_settings

logger = logging.getLogger("yojana.migrations.v18")
settings = get_settings()


def run_migration_v18():
    """Add performance-critical composite indexes."""
    db_path = settings.database_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
    if not db_path or "sqlite" not in settings.database_url:
        logger.info("Skipping v18 migration: not a SQLite database")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    indexes = [
        # Schemes table — used by list_schemes, search, eligibility
        ("idx_schemes_active_level", "schemes", "is_active, level"),
        ("idx_schemes_active_status", "schemes", "is_active, status"),
        ("idx_schemes_active_category", "schemes", "is_active, category_id"),
        ("idx_schemes_active_state", "schemes", "is_active, state_code"),
        ("idx_schemes_name", "schemes", "name"),

        # Queue jobs — used by get_next_job and enqueue_job
        ("idx_qjobs_status_priority_runafter", "queue_jobs", "status, priority DESC, run_after"),
        ("idx_qjobs_taskname_status", "queue_jobs", "task_name, status"),

        # Chat messages — used by history lookup
        ("idx_chat_session_created", "chat_history", "session_id, created_at"),

        # Notification logs — used by dashboard counts
        ("idx_notif_logs_status", "notification_logs", "status"),

        # Search history — used by analytics
        ("idx_search_history_timestamp", "search_history", "timestamp"),

        # Job execution history — used by dashboard and crash recovery
        ("idx_job_exec_status", "job_execution_history", "status"),

        # Sync audit logs — used by dashboard stats
        ("idx_sync_audit_operation", "sync_audit_logs", "operation"),

        # Eligibility rules — used by selectinload joins
        ("idx_eligibility_rules_scheme", "eligibility_rules", "scheme_id"),

        # Crawl queue — used by scheduler pipeline
        ("idx_crawl_queue_status", "crawl_queue", "status"),
    ]

    created = 0
    for idx_name, table, columns in indexes:
        try:
            cursor.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table} ({columns})")
            created += 1
        except Exception as e:
            logger.warning(f"Index {idx_name} creation skipped: {e}")

    conn.commit()
    conn.close()
    logger.info(f"Phase 18 migration: created/verified {created} performance indexes.")
