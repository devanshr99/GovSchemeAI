# GovSchemeAI

GovSchemeAI is an AI-powered portal designed to track, crawl, clean, extract, and manage Indian government schemes. The system features automatic crawling of government portals, LLM-based structured data extraction, automatic duplicate scheme detection, dynamic lifecycle tracking, and historical version logging.

---

## Technical Architecture

```mermaid
graph TD
    A[Vercel Frontend - Next.js] -->|API Proxy / rewrites| B[Render Backend - FastAPI]
    B -->|Async connection| C[PostgreSQL Database]
    D[Render Background Worker - Scheduler] -->|Triggers crawling & extraction| B
    E[Render Background Worker - Queue Worker] -->|Processes background jobs| B
```

* **Frontend**: Next.js (TypeScript) deployed to **Vercel**
* **Backend**: FastAPI (Python 3.11) deployed to **Render**
* **Database**: PostgreSQL (v15+) managed service on **Render**
* **In-Memory Cache & Broker**: Redis (optional, fallback to in-memory queues)

---

## Environment Variables

### Backend Configuration (`backend/.env`)
Create a `.env` file in the `backend/` directory based on [backend/.env.example](file:///c:/Users/devan/Desktop/government%20schemes/GovSchemeAI/backend/.env.example):
* `DATABASE_URL`: Connection string for PostgreSQL (e.g., `postgresql+asyncpg://user:pass@host:port/db`) or SQLite in development (`sqlite+aiosqlite:///./govscheme_ai.db`).
* `PRIMARY_AI_PROVIDER`: Choose from `openrouter` (recommended), `gemini`, `openai`, or `anthropic`.
* `OPENROUTER_API_KEY`: API key for accessing LLMs via OpenRouter.
* `JWT_SECRET`: Security secret key for signing admin dashboard JSON Web Tokens.

### Frontend Configuration (`frontend/.env`)
Create a `.env` file in the `frontend/` directory based on [frontend/.env.example](file:///c:/Users/devan/Desktop/government%20schemes/GovSchemeAI/frontend/.env.example):
* `BACKEND_URL`: URL of the deployed FastAPI backend service.

---

## Local Development Setup

### 1. Backend Server Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The API documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend Application Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Automated Verification & CI/CD Pipeline

The project features a lightweight GitHub Actions workflow [production.yml](file:///.github/workflows/production.yml) that automatically runs:
1. **Security Scan**: `Bandit` audit on all python code.
2. **Backend Tests**: `pytest` unit/integration suites (119 test cases covering crawlers, LLM parsers, backup cycles, failovers).
3. **Frontend Audit**: `npm audit` validating package dependencies.
4. **Frontend Compilation**: Next.js compilation (`npm run build`) validating TypeScript type safety.

To run tests locally:
```bash
# Backend
cd backend
python -m pytest

# Frontend
cd frontend
npm run build
```

---

## Production Deployment Guide

### 1. Database (PostgreSQL)
1. Provision a PostgreSQL instance on **Render** (or AWS RDS / Supabase).
2. Note the internal/external database URL. Ensure you prefix it with `postgresql+asyncpg://` to load the asynchronous client driver.

### 2. Backend (FastAPI Web Service)
1. Create a new **Web Service** on Render connected to the repository.
2. Set the root directory to `backend`.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Configure Environment Variables in the Render Dashboard (pointing `DATABASE_URL` to your PostgreSQL database).

### 3. Automatic Updates & Workers (Render Background Workers)
* **Scheduler Engine**:
  * Create a Render **Background Worker**.
  * Command: `python -m app.scheduler`
  * Add the same database environment variables.
* **Queue Worker**:
  * Create a Render **Background Worker**.
  * Command: `python -m app.services.worker_manager`

### 4. Frontend (Vercel)
1. Import the repository into **Vercel**.
2. Vercel automatically detects Next.js.
3. Configure the Root Directory to `frontend`.
4. Add the Environment Variable:
   * `BACKEND_URL`: `https://your-backend-api-url.onrender.com`
5. Click **Deploy**. Vercel will build and serve the app on their global edge network.