# System Architecture Guide

This document describes the end-to-end technical architecture of **GovSchemeAI**, covering the dataflow patterns, server topologies, background processing loops, and high-availability failover designs.

---

## 🏗️ Architectural Overview

GovSchemeAI is built upon a decoupled, service-oriented architecture designed to handle high-concurrency scraping, intensive AI parsing, and rapid user-facing queries. The stack is split into three main layers:

1. **Presentation & Gateway Layer (Next.js 15 / TypeScript)**
2. **Application & Processing Layer (FastAPI ASGI / Python)**
3. **Storage & Data Orchestration Layer (PostgreSQL, Redis, Worker Queues)**

```
+-------------------------------------------------------------+
|                      Presentation Layer                     |
|         Next.js Web App (Vercel Global Edge Network)         |
+-------------------------------------------------------------+
                               |
                   HTTP API Proxies / Rewrites
                               v
+-------------------------------------------------------------+
|                      Application Layer                      |
|         FastAPI ASGI Server (Render Cloud Web Service)       |
+-------------------------------------------------------------+
            /                  |                   \
    JSON payloads      Async Queries       Job Triggers
          v                    v                   v
+-------------------+ +------------------+ +------------------+
|    AI Services    | | Database Cluster | | Worker / Queue   |
| OpenRouter/Gemini | | PostgreSQL (HA)  | | Background Pools |
+-------------------+ +------------------+ +------------------+
```

---

## ⚡ 1. Presentation & Gateway Layer (Next.js)

The client application runs on **Next.js 15** utilizing the App Router architecture. It handles user interactions, eligibility stepper forms, search interfaces, and admin dashboards.

### API Proxy & Rewrites
To prevent Cross-Origin Resource Sharing (CORS) complications and optimize API routing, Next.js handles proxying requests to the backend server.
* Configuration is defined in `next.config.ts` via rewrite paths:
  ```typescript
  // Redirects frontend requests from /api/:path* to backend:port/:path*
  const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.BACKEND_URL}/:path*`,
        },
      ];
    },
  };
  ```
* Benefit: Client browsers only communicate with the Next.js domain (e.g. `govscheme-ai.vercel.app`), while Next.js routes API calls securely to Render.

---

## 🚀 2. Application Layer (FastAPI)

The backend is built with **FastAPI**, running on top of an ASGI server (**Uvicorn**). It uses an asynchronous runtime (`asyncio`) to ensure non-blocking I/O during database requests and network calls to external LLMs.

### Custom Middleware Pipeline
FastAPI executes incoming requests through multiple custom middleware components before hitting routers:
1. **ResponseTimingMiddleware**: Adds `X-Response-Time` to trace response latency in milliseconds.
2. **SecurityHeadersMiddleware**: Sets secure response headers (`X-Frame-Options`, `Content-Security-Policy`, etc.).
3. **RequestSizeLimitMiddleware**: Hard-limits payload sizes to `5MB` to mitigate Denial of Service (DoS) vectors.
4. **RateLimitMiddleware**: Implements basic in-memory rate limiting (`100` requests per IP per minute) with active garbage collection to prevent memory leaks.
5. **ObservabilityMiddleware**: Logs requests, routes, status codes, and latencies to Prometheus counters.

---

## 🗄️ 3. Storage & Data Orchestration Layer

Data management involves real-time CRUD operations, staging storage for crawled records, version logs, and background worker queues.

### Database Connection Pool Tuning
SQLAlchemy establishes asynchronous connections to PostgreSQL using the `asyncpg` driver. To support heavy workloads, the system utilizes optimized engine arguments in `app/database.py`:
* `pool_size=10`: Ensures a persistent baseline of 10 database sessions.
* `max_overflow=20`: Allows the pool to temporarily spin up to 20 additional concurrent connections during traffic spikes.
* `pool_recycle=300`: Refreshes connection sockets every 5 minutes to prevent stale tcp hang-ups.
* `pool_pre_ping=True`: Verifies that a connection is still alive via a mock ping query before returning it to the session pool.

### Background Queue & Workers
To avoid bottlenecking client requests, long-running processes (e.g., AI extraction, indexing, report generation) are offloaded to an asynchronous internal queue system.
* **Worker Manager**: Spawns concurrent daemon threads (`app/services/worker_manager.py`) monitoring the `queue_jobs` database queue.
* **Database State Queueing**: Instead of relying on a complex external broker like RabbitMQ, the system implements a database-backed transactional queue. Workers execute row locks (`SELECT FOR UPDATE SKIP LOCKED`) to fetch and execute tasks safely across multiple nodes.

### Telemetry & Automated Failover
For enterprise-level reliability, two continuous daemons run during the lifespan of the backend:
1. **Telemetry Collector**: Runs on a background loop collecting OS metrics (CPU usage, memory footprint), API stats, and job queues, formatting them to Prometheus specifications.
2. **Database Failover Daemon (`app/services/failover_manager.py`)**:
   * Periodically monitors database connections.
   * If a database outage is detected, the daemon automatically updates global engine pools to route queries to a pre-defined read/write hot replica database without restarting the application process.
