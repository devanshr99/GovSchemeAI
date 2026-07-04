# YojanaAI Docker Guide

This guide details Docker construction, multi-stage configurations, and service orchestration guidelines.

## Service Registry Overview

The containerized stack includes the following decoupled services:
- **`database`:** Runs Postgres 15 alpine carrying persistent schemas under volume `pg_data`.
- **`redis`:** Message broker and caching instance using volume `redis_data`.
- **`backend`:** FastAPI REST API executing Python 3.11 slim. Includes prompt verification and synchronizer tasks.
- **`frontend`:** Next.js standalone runner exposing Port 3000.
- **`worker`:** Decoupled crawler task execution agent. Runs as a backend image instance executing `worker_manager.py`.
- **`scheduler`:** Decoupled scheduled task daemon executing `app.scheduler`.
- **`reverse-proxy`:** Performance-tuned Nginx routing client queries, rate limiting API calls, and enforcing security headers.

## Useful Docker Compose Commands

- **Build and Start Container Stack:**
  ```bash
  docker compose up -d --build
  ```
- **Inspect Live Services Logs:**
  ```bash
  docker compose logs -f --tail 100
  ```
- **Check Port Registries & Health Check Status:**
  ```bash
  docker compose ps
  ```
- **Stop Stack and Retain Volumes:**
  ```bash
  docker compose down
  ```
- **Purge System Volumes & Hard Clean Container Cache:**
  ```bash
  docker compose down -v
  ```
