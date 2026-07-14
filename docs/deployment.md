# Deployment & CI/CD Pipeline Guide

This document describes how to deploy **GovSchemeAI** across cloud environments (Vercel, Render) or virtual private servers (VPS), and details the CI/CD pipeline.

---

## ☁️ Cloud Platforms Setup

The platform is designed to run efficiently in standard decoupled environments:
* **Frontend**: Hosted on **Vercel** for optimal speed, caching, and serverless scalability.
* **Backend**: Hosted on **Render** as a Python Web Service.
* **Database**: Hosted on **Render** (or AWS RDS / Supabase) as a managed PostgreSQL instance.
* **Background Workers**: Hosted on **Render** as Background Workers.

### 1. Database (PostgreSQL)
1. Provision a PostgreSQL instance (v15+) on Render or Supabase.
2. Store the database connection URL. Note that it **must** start with `postgresql+asyncpg://` to load the asynchronous `asyncpg` driver in SQLAlchemy:
   `postgresql+asyncpg://<user>:<password>@<host>:<port>/<database>`

### 2. Backend API Service (Render Web Service)
1. Select **New > Web Service** in Render.
2. Link your GovSchemeAI repository.
3. Configure the following properties:
   * **Root Directory**: `backend`
   * **Runtime**: `Docker`
   * **Dockerfile Path**: `Dockerfile`
4. Under **Environment Variables**, register the required environment keys (see [Environment Variables Guide](file:///c:/Users/devan/Desktop/government%20schemes/GovSchemeAI/docs/environment.md)).

### 3. Background Workers (Render Background Workers)
Since background schedules and extraction processing shouldn't run inside the HTTP API threads (which would degrade response times), GovSchemeAI splits execution into two secondary worker processes:
1. **Scheduler Worker**:
   * Create a Render **Background Worker**.
   * Command: `python -m app.scheduler`
   * Add the same database environment variables.
2. **Queue Worker**:
   * Create a Render **Background Worker**.
   * Command: `python -m app.services.worker_manager`
   * Add the same database environment variables.

### 4. Frontend Client (Vercel)
1. Select **Import Project** on Vercel and select the repository.
2. Configure project directory settings:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Next.js`
3. Add the following **Environment Variables**:
   * `NEXT_PUBLIC_API_URL`: Direct production URL of your Render Web Service (e.g. `https://govscheme-ai-api.onrender.com`).
4. Click **Deploy**. Vercel will build and serve your app.

---

## 🐳 Self-Hosted VPS Deployment

To host the entire stack on a single virtual machine (AWS EC2, DigitalOcean Droplet, etc.):

### Prerequisites
* Docker & Docker Compose installed.
* Ports `80` and `443` open.
* A domain name pointing to your VPS IP address.

### Step-by-Step Setup
1. Clone the repository and navigate to root:
   ```bash
   git clone https://github.com/devanshr99/GovSchemeAI.git
   cd GovSchemeAI
   ```
2. Copy the production configurations to the root environment:
   ```bash
   cp backend/.env.production .env
   ```
3. Edit the `.env` settings to include production API keys and database parameters.
4. Run the services in detached mode:
   ```bash
   docker compose up -d --build
   ```
5. Set up SSL certificates via Certbot:
   ```bash
   docker compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --email devanshrastogi993@gmail.com --agree-tos --no-eff-email -d yojana-ai.gov.in
   ```

---

## 🛠️ GitHub Actions CI/CD Pipeline

The continuous deployment engine is located in [production.yml](file:///c:/Users/devan/Desktop/government%20schemes/GovSchemeAI/.github/workflows/production.yml). It automates quality reviews, testing, and deployment.

```
+---------------------------------------------------------------+
|                      CI/CD Pipeline Stages                    |
+---------------------------------------------------------------+
       |
       v
+------------------+ +------------------+ +-------------------+
|  Bandit Security | |   Pytest Unit    | | Next.js TypeScript|
|  Python Audit    | |   Test Suite     | | Lint & Build     |
+------------------+ +------------------+ +-------------------+
       |                      |                      |
       +----------------------+----------------------+
                              |
                              v
                  Docker Build & Image Push
                   To GitHub Packages (GHCR)
                              |
                              v
                     SSH VPS Deployment &
                     Health Verification
                              |
                              v
                  Auto-Rollback on Failure
```

### Automation Phases
1. **Lint, Test, and Scan**:
   * Runs `Bandit` to inspect Python code for security vulnerabilities.
   * Runs the backend `pytest` test suite (verifying crawlers, engines, and database lifecycles).
   * Compiles the Next.js frontend to verify TypeScript safety and ESLint constraints.
2. **Container Registry Building**:
   * Logs in to the GitHub Container Registry (`ghcr.io`).
   * Builds production Docker images for both backend and frontend, tagging them with the commit Git SHA.
3. **SSH Remote Deployment & Verification**:
   * Accesses the production VPS host via SSH.
   * Downloads the latest image versions and restarts containers via `docker compose down && docker compose up -d`.
   * Queries the `/ready` API endpoint. If it does not return HTTP `200` within 3 minutes, the deployment script automatically rolls back container tags to the last known stable release image.
