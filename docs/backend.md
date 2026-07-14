# Backend Architecture & Services Guide

This document describes the FastAPI backend service for **GovSchemeAI**, outlining the package organization, dependency injections, database sessions, and custom services.

---

## 📂 Backend Directory Layout

The python backend is structured in an enterprise-grade modular pattern inside the `/backend/app` directory:

```
backend/app/
├── migrations/             # Incremental database migrations (Phases 2-18)
├── models/                 # SQLAlchemy Declarative Declarations
│   ├── scheme.py           # Schemes, Categories, and Eligibility rules models
│   ├── staging.py          # Temporary tables for crawled items & runs
│   ├── scheduler.py        # Cron scheduler jobs and execution logs models
│   └── user.py             # User and bookmark association models
├── routers/                # FastAPI endpoint controllers
│   ├── schemes.py          # Public scheme catalog endpoints
│   ├── eligibility.py      # Rules checker engine triggers
│   ├── chat.py             # RAG LLM query entrypoint
│   └── dashboard.py        # Admin panel analytics and sync controls
├── schemas/                # Pydantic data serialization schemas
│   ├── scheme.py           # Verification models for schemes and rules
│   └── chat.py             # Prompt payloads and message models
├── scrapers/               # Automated site crawlers and parsers
│   ├── base.py             # Abstract base scraping contract
│   ├── myscheme_scraper.py # Target portal parser for myScheme
│   └── orchestrator.py     # Crawl execution coordinator
├── services/               # Core business logic pipelines
│   ├── ai_service.py       # OpenRouter and Gemini API wrappers
│   ├── eligibility_engine.py # Boolean rules evaluation processor
│   ├── sync_engine.py      # Staging database merging engine
│   └── worker_manager.py   # Daemon worker thread pool controller
├── utils/                  # Observability, logging and diagnostic utilities
├── config.py               # Settings loader utilizing BaseSettings
└── main.py                 # ASGI entry point registering routes & middleware
```

---

## ⚙️ Key Concepts & Design Patterns

### 1. Dependency Injection Pattern
FastAPI utilizes a dependency injection framework to inject resources like database sessions or security context.
* **Database Session Injection (`get_db`)**:
  ```python
  from app.database import async_session
  from sqlalchemy.ext.asyncio import AsyncSession

  async def get_db() -> AsyncSession:
      async with async_session() as session:
          try:
              yield session
          finally:
              await session.close()
  ```
  Usage in routers:
  ```python
  @router.get("/{scheme_id}")
  async def get_scheme(scheme_id: str, db: AsyncSession = Depends(get_db)):
      return await scheme_service.get_by_id(db, scheme_id)
  ```
* **Admin Authentication (`verify_admin`)**:
  Protects endpoints by extracting, decoding, and verifying JWT tokens sent in authorization headers.

### 2. Request & Response Validation (Pydantic)
Pydantic schemas enforce type safety at the API layer.
* Input payloads are automatically parsed and validated before reaching route code.
* Output payloads are serialized via `response_model` constraints, filtering out sensitive model fields (e.g. user password hashes).

### 3. Middleware Architecture
FastAPI registers middleware classes sequentially to construct an interception pipeline:
* **Gzip Compression**: Compresses json payloads over `500 bytes` to minimize network overhead.
* **Rate Limiting**: Checks client IP addresses against in-memory timestamps and denies traffic exceeding thresholds.
* **Observe & Report**: Intercepts latencies and responses, passing telemetry directly to the Prometheus collector.

---

## 💼 Core Service Systems

### RAG & AI Pipeline (`ai_service.py`, `ai_pipeline.py`)
Provides conversational capabilities regarding Indian government policies.
1. **Semantic Chunking**: Scrapes, splits, and embeds scheme descriptions.
2. **Context Retrieval**: Performs vector search matches to extract relevant context.
3. **Response Generation**: Queries OpenRouter or Google Gemini with prompt templates containing the query and retrieved context.

### Rules Engine (`eligibility_engine.py`)
Evaluates user demographic matrices against criteria lists stored in the database.
* Parses operator values dynamically (e.g., matching if the user's `age >= rule.min` AND `income <= rule.max`).
* Supports dynamic exclusions (e.g., matching state values like `state IN ["Delhi", "Maharashtra"]`).
