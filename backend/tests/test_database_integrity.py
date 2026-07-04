import pytest
import sqlite3
from sqlalchemy import select, insert
from sqlalchemy.exc import IntegrityError
from app.database import get_db, init_db
from app.models.source import GovernmentSource
from app.models.scheme import Scheme, Category, EligibilityRule
from app.models.audit import SyncAuditLog
from app.migrations.db_migration_v18 import run_migration_v18

@pytest.mark.asyncio
async def test_crud_operations():
    """Verify standard CRUD operations on database models."""
    await init_db()
    
    async for db in get_db():
        # 1. Create
        cat = Category(name="Test Category", slug="test-cat")
        db.add(cat)
        await db.commit()
        await db.refresh(cat)
        assert cat.id is not None
        
        # 2. Read
        stmt = select(Category).where(Category.slug == "test-cat")
        res = await db.execute(stmt)
        cat_retrieved = res.scalars().first()
        assert cat_retrieved is not None
        assert cat_retrieved.name == "Test Category"
        
        # 3. Update
        cat_retrieved.name = "Test Category Updated"
        await db.commit()
        await db.refresh(cat_retrieved)
        assert cat_retrieved.name == "Test Category Updated"
        
        # 4. Delete
        await db.delete(cat_retrieved)
        await db.commit()
        
        # Verify deleted
        res_del = await db.execute(stmt)
        assert res_del.scalars().first() is None
        break

@pytest.mark.asyncio
async def test_transaction_rollback():
    """Verify transaction commits rollback successfully upon mid-flight execution exceptions."""
    await init_db()
    
    async for db in get_db():
        # Attempt multi-insert transaction
        cat = Category(name="Rollback Category", slug="rollback-cat")
        db.add(cat)
        await db.flush() # Sync state
        
        # Intentionally cause constraint violation with a duplicate slug in the same transaction
        cat_duplicate = Category(name="Rollback Duplicate", slug="rollback-cat")
        db.add(cat_duplicate)
        
        with pytest.raises(IntegrityError):
            await db.commit()
            
        await db.rollback()
        
        # Verify nothing was saved in the database
        stmt = select(Category).where(Category.slug == "rollback-cat")
        res = await db.execute(stmt)
        assert res.scalars().all() == []
        break

@pytest.mark.asyncio
async def test_database_constraints():
    """Verify database unique and non-null constraints are enforced."""
    await init_db()
    
    async for db in get_db():
        # 1. Non-null constraint failure
        invalid_source = GovernmentSource(
            name=None, # Non-nullable field
            category="Ministry",
            website_url="https://constraint-fail.gov.in"
        )
        db.add(invalid_source)
        with pytest.raises(IntegrityError):
            await db.commit()
        await db.rollback()
        
        # 2. Unique constraint failure
        src1 = GovernmentSource(
            name="Unique Source One",
            category="Ministry",
            website_url="https://unique-fail.gov.in"
        )
        db.add(src1)
        await db.commit()
        
        src2 = GovernmentSource(
            name="Unique Source Two",
            category="Ministry",
            website_url="https://unique-fail.gov.in" # Duplicate URL
        )
        db.add(src2)
        with pytest.raises(IntegrityError):
            await db.commit()
        await db.rollback()
        
        # Clean up
        await db.delete(src1)
        await db.commit()
        break

@pytest.mark.asyncio
async def test_composite_indexes_exist():
    """Verify that all Phase 18 composite indexes are successfully registered in SQLite database schema."""
    await init_db()
    run_migration_v18()
    
    async for db in get_db():
        # Query SQLite schema directly for index listings
        conn = await db.connection()
        
        # Sync cursor to look up indexes
        def query_indexes(sync_conn):
            cursor = sync_conn.connection.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
            rows = cursor.fetchall()
            cursor.close()
            return [r[0] for r in rows]
            
        index_names = await conn.run_sync(query_indexes)
        
        expected_indexes = [
            "idx_schemes_active_level",
            "idx_schemes_active_status",
            "idx_qjobs_status_priority_runafter",
            "idx_chat_raw_session_created" if "idx_chat_raw_session_created" in index_names else "idx_chat_session_created",
            "idx_notif_logs_status"
        ]
        
        for expected in expected_indexes:
            assert expected in index_names, f"Expected index {expected} not found in schema: {index_names}"
        break
