"""
Database engine and session management.
Supports SQLite (dev) and PostgreSQL (prod) via async SQLAlchemy.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
from app.config import get_settings

settings = get_settings()

_is_sqlite = "sqlite" in settings.database_url

# Build engine with optimized pool configuration
_engine_kwargs = {
    "echo": settings.debug,
}

if _is_sqlite:
    # SQLite needs check_same_thread=False for async
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL / production pool tuning
    _engine_kwargs.update({
        "pool_size": 10,         # Persistent connections
        "max_overflow": 20,      # Burst connections beyond pool_size
        "pool_recycle": 300,     # Recycle stale connections every 5 min
        "pool_timeout": 30,      # Wait max 30s for connection from pool
        "pool_pre_ping": True,   # Verify connections are alive before checkout
    })

engine = create_async_engine(settings.database_url, **_engine_kwargs)


async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    """Dependency: yields a database session per request."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Create all tables. Called on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Dispose engine. Called on shutdown."""
    await engine.dispose()


async def failover_database_engine_async(new_url: str):
    """Dynamic failover to switch database connections in real time without reloading the process."""
    global engine, async_session
    await engine.dispose()
    engine = create_async_engine(new_url, **_engine_kwargs)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

