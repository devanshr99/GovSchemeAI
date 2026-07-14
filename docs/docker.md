# Containerization & Docker Orchestration Guide

This document describes the container setup of **GovSchemeAI**, explaining the build instructions, compose configurations, networking parameters, and volume mounts.

---

## 🏗️ Services Architecture

The system runs 9 containerized services configured under [docker-compose.yml](file:///c:/Users/devan/Desktop/government%20schemes/GovSchemeAI/docker-compose.yml):

```
                       +-----------------------+
                       |  Nginx Reverse Proxy  |
                       |      (Port 80/443)    |
                       +-----------+-----------+
                                   |
                +------------------+------------------+
                |                                     |
                v                                     v
    +-----------------------+             +-----------------------+
    |    govscheme-frontend |             |    govscheme-backend  |
    |      (Next.js App)    |             |      (FastAPI API)    |
    +-----------------------+             +-----------+-----------+
                                                      |
                    +-------------------+-------------+-------------+-------------------+
                    |                   |                           |                   |
                    v                   v                           v                   v
        +-------------------+ +-------------------+     +-------------------+ +-------------------+
        | govscheme-database| |  govscheme-redis  |     | govscheme-worker  | |govscheme-scheduler|
        |   (PostgreSQL)    | |   (Cache/Queue)   |     |  (Queue Worker)   | | (APScheduler)     |
        +-------------------+ +-------------------+     +-------------------+ +-------------------+
```

---

## 📦 Container Services Definitions

### 1. Database (`govscheme-database`)
* **Base Image**: `postgres:15-alpine`
* **Network**: Joined to private `govscheme-backend`.
* **Health Check**: Executes `pg_isready` check every 10 seconds. Services depending on the DB wait until it becomes healthy.

### 2. Redis Cache Broker (`govscheme-redis`)
* **Base Image**: `redis:7-alpine`
* **Network**: Private `govscheme-backend` network.
* **Storage**: Data is saved to the local host filesystem via local volume mappings.

### 3. Backend API Server (`govscheme-backend`)
* **Base Image**: Custom build using Python 3.11-slim.
* **Port**: Exposes `8000`.
* **Database Driver**: Uses SQLAlchemy async parameters linking to the database container over internal port `5432`.

### 4. Frontend Web App (`govscheme-frontend`)
* **Base Image**: Custom Node.js 20-alpine build.
* **Port**: Exposes `3000`.
* **API Proxy**: Routes traffic to backend container via `http://backend:8000`.

### 5. Queue Worker (`govscheme-worker`) & Scheduler (`govscheme-scheduler`)
* Spun up from the same backend image context.
* Executes background jobs (`worker_manager` loop) and cron timing sequences (`scheduler` loop) respectively.

### 6. Reverse Proxy (`govscheme-reverse-proxy`)
* **Base Image**: `nginx:1.25-alpine`
* **Ports**: Opens standard ports `80` (HTTP) and `443` (HTTPS) to public network interfaces.
* **Proxy Targets**: Translates paths to inner container nodes (`frontend:3000` and `backend:8000`).

---

## 🔒 Internal Networking Layout

To prevent exposing databases and brokers directly to public access ports, the environment isolates interfaces using Docker networks:

1. **`govscheme-frontend`**:
   * Bridge network connecting client browser sessions to Nginx and Next.js frontend containers.
2. **`govscheme-backend`**:
   * Isolated network linking the backend API, scheduler, queue workers, PostgreSQL database, and Redis cache. Databases and data brokers are kept fully secure behind this boundary.

---

## 📁 Storage Volumes Configurations

Persistent data is retained using named Docker volumes:
* `pg_data`: Stores PostgreSQL transaction files.
* `redis_data`: Retains session key data.
* `backend_data`: Stores crawler reports, staging backups, and local file exports.
* `prometheus_data` & `grafana_data`: Captures metrics databases and visualization settings.
