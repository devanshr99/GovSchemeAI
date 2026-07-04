# YojanaAI Deployment Guide

This guide details steps to deploy YojanaAI on various cloud platforms and virtual private servers (VPS).

## VPS Deployment (AWS EC2, DigitalOcean Droplet, GCP Compute Engine, Azure VM)

### Prerequisites
- Docker & Docker Compose installed on host.
- Domain pointing to VPS IP address (e.g. `yojana-ai.gov.in`).
- Port 80 & 443 open on firewall settings.

### Deployment Instructions
1. **Clone project repository and create configuration structure:**
   ```bash
   git clone <repo-url> /app/yojana-ai
   cd /app/yojana-ai
   ```
2. **Create Nginx SSL Directory and Certificate Placeholders:**
   ```bash
   mkdir -p nginx/ssl/live/yojana-ai.gov.in
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout nginx/ssl/live/yojana-ai.gov.in/privkey.pem \
     -out nginx/ssl/live/yojana-ai.gov.in/fullchain.pem \
     -subj "/CN=localhost"
   ```
3. **Configure Environment Parameters:**
   Copy `.env.production` from `backend/` to root `.env`, and populate target secrets:
   ```bash
   cp backend/.env.production .env
   nano .env
   ```
4. **Boot Container Services:**
   ```bash
   docker compose up -d --build
   ```
5. **Set up Automated Let's Encrypt SSL (Via Certbot):**
   Run Certbot in standalone/webroot mode to fetch production certificates, replacing the placeholder keys created in Step 2.

---

## Managed Cloud Services (Render, Railway, DigitalOcean App Platform)

YojanaAI supports modular cloud service declarations:
- **Backend API Service:**
  - Build Command: Left empty (Docker-based deploy).
  - Dockerfile Path: `./backend/Dockerfile`.
  - Expose Port: `8000`.
- **Frontend App Service:**
  - Dockerfile Path: `./frontend/Dockerfile`.
  - Expose Port: `3000`.
- **Managed Databases:**
  - Spin up managed PostgreSQL and Redis instances on the cloud provider, and configure target environment variable URLs (`DATABASE_URL`, `REDIS_URL`) on the backend API configurations dashboard.
