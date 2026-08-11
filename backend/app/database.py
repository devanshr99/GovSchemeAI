"""
Database engine and session management.
Supports SQLite (dev) and PostgreSQL (prod) via async SQLAlchemy.
Automatically normalizes connection strings and configures SSL for cloud deployments (e.g. Render/Supabase).
"""

import ssl
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

raw_db_url = settings.database_url

# Normalize postgres URL schemes for asyncpg driver compatibility
if raw_db_url.startswith("postgres://"):
    db_url = raw_db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+asyncpg://"):
    db_url = raw_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    db_url = raw_db_url

_is_sqlite = "sqlite" in db_url

# Build engine with optimized pool configuration
_engine_kwargs = {
    "echo": settings.debug,
}

if _is_sqlite:
    # SQLite needs check_same_thread=False for async
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL / cloud database configuration (Render / Supabase / AWS RDS)
    connect_args = {}
    
    # Configure SSL context for PostgreSQL connections if required or on cloud hosts
    if "sslmode=require" in db_url or "render.com" in db_url or not settings.debug:
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        connect_args["ssl"] = ssl_ctx

    _engine_kwargs.update({
        "connect_args": connect_args,
        "pool_size": 10,         # Persistent connections
        "max_overflow": 20,      # Burst connections beyond pool_size
        "pool_recycle": 300,     # Recycle stale connections every 5 min
        "pool_timeout": 30,      # Wait max 30s for connection from pool
        "pool_pre_ping": True,   # Verify connections are alive before checkout
    })

engine = create_async_engine(db_url, **_engine_kwargs)

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
    
    if new_url.startswith("postgres://"):
        new_url = new_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif new_url.startswith("postgresql://") and not new_url.startswith("postgresql+asyncpg://"):
        new_url = new_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    failover_kwargs = dict(_engine_kwargs)
    engine = create_async_engine(new_url, **failover_kwargs)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
