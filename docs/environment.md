# Environment Variables Configuration Reference

This guide details all environment variables used by the backend API and frontend Next.js services in **GovSchemeAI**.

---

## 💻 Frontend Configuration (`frontend/.env`)

These variables are consumed during the Next.js static build phase or client-side runtime.

| Variable Name | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | String | `http://localhost:8000` | Public API endpoint of the FastAPI server. Used by Axios to route scheme searches, eligibility queries, and AI chatbot prompts. |
| `PORT` | Integer | `3000` | Port on which the Next.js server listens when launched locally. |
| `NODE_ENV` | String | `development` | Build environment context. Set to `production` in live builds. |

---

## 🐍 Backend Configuration (`backend/.env`)

These variables are defined in the FastAPI process environment or loaded from a local `backend/.env` file.

### 1. Server & System Settings

| Variable Name | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `DEBUG` | Boolean | `False` | Enables debug logs, verbose error responses, and SQLAlchemy log echoing. |
| `HOST` | String | `0.0.0.0` | IP binding of the FastAPI ASGI server. |
| `PORT` | Integer | `8000` | Port on which the Uvicorn web server listens. |

### 2. Database & Cache URLs

| Variable Name | Type | Default Value | Description | Security Level |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String | `sqlite+aiosqlite:///./govscheme_ai.db` | Primary datastore connection string. For production, specify PostgreSQL with `postgresql+asyncpg://` driver. | **Sensitive** |
| `REPLICA_DATABASE_URL` | String | `""` | Optional read-replica database connection string used by the Disaster Recovery Failover daemon. | **Sensitive** |
| `REDIS_URL` | String | `""` | Redis connection URL (e.g. `redis://localhost:6379/0`) for fast data caching. | **Sensitive** |

### 3. AI Providers & Keys

| Variable Name | Type | Default Value | Description | Security Level |
| :--- | :--- | :--- | :--- | :--- |
| `PRIMARY_AI_PROVIDER` | String | `openrouter` | Choices: `openrouter` (recommended), `gemini`, `openai`, `anthropic`. | Public |
| `OPENROUTER_API_KEY` | String | `""` | API key to access models (Gemini, Claude, GPT) via OpenRouter. | **Sensitive** |
| `OPENROUTER_MODEL` | String | `google/gemini-2.5-flash` | LLM model path on OpenRouter. | Public |
| `GEMINI_API_KEY` | String | `""` | Direct Google Gemini API credential key. | **Sensitive** |
| `OPENAI_API_KEY` | String | `""` | Direct OpenAI API key. | **Sensitive** |
| `ANTHROPIC_API_KEY` | String | `""` | Direct Anthropic Claude API key. | **Sensitive** |

### 4. Background Scheduler Settings

| Variable Name | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `UPDATE_ENABLED` | Boolean | `False` | Toggles whether the background scraper scheduler automatically runs recurring jobs. |
| `UPDATE_SCHEDULE_CRON` | String | `0 2 * * *` | Standard 5-field cron timing expression defining updates frequency (defaults to daily at 2:00 AM). |
| `UPDATE_AUTO_APPROVE_THRESHOLD` | Float | `0.95` | Similarity confidence score (0.0 to 1.0) above which crawled staging records are merged into active tables without manual admin approval. |

### 5. Security & Authentication

| Variable Name | Type | Default Value | Description | Security Level |
| :--- | :--- | :--- | :--- | :--- |
| `JWT_SECRET` | String | `govscheme-ai-dev-secret-change-in-prod` | Cryptographic secret used to sign admin JWT security tokens. | **Highly Sensitive** |
| `JWT_ALGORITHM` | String | `HS256` | Hash signing algorithm. | Public |
| `JWT_EXPIRE_MINUTES` | Integer | `1440` | JWT token validity window (defaults to 24 hours). | Public |
| `RATE_LIMIT_PER_MINUTE` | Integer | `60` | Request limits threshold enforced by security middlewares. | Public |

### 6. Backups & Disaster Recovery

| Variable Name | Type | Default Value | Description | Security Level |
| :--- | :--- | :--- | :--- | :--- |
| `BACKUP_STORAGE_PROVIDER` | String | `local` | Storage target for database dumps. Choices: `local`, `s3`, `gcs`, `azure`, `b2`. | Public |
| `BACKUP_ENCRYPTION_KEY` | String | `govscheme-ai-backup-enc-key-change-in-prod` | Passphrase used to encrypt SQLite / PostgreSQL dump zip files. | **Highly Sensitive** |
| `AWS_ACCESS_KEY_ID` | String | `""` | AWS credentials used to upload backups to S3 buckets. | **Sensitive** |
| `AWS_SECRET_ACCESS_KEY` | String | `""` | AWS credentials used to upload backups to S3 buckets. | **Sensitive** |
