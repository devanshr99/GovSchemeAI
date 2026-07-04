# YojanaAI CI/CD Guide

This guide covers YojanaAI automated pipeline workflows, linting, builds, testing, security audits, and continuous deployments.

## GitHub Actions Workflows

The CI/CD pipeline is defined inside `.github/workflows/production.yml` and implements three main phases:

### Phase 1: Lint, Test, and Scan
- **Python Quality check:** Bandit static analyzer checks the backend app for common security issues.
- **Backend Tests:** Automated suite runs all unit, integration, RAG, and concurrency tests.
- **Node.js Quality Check:** Runs standard project build and executes `npm audit` checking for high-vulnerability packages.

### Phase 2: Docker Builds
- Triggers on push to `main` branch or tag releases (`v*`).
- Logs in to GitHub Container Registry (`ghcr.io`).
- Builds multi-stage production-ready frontend and backend images.
- Pushes images tagged with git SHA and `latest` marker.

### Phase 3: SSH Deploy / Rollback
- Logs in to the target VPS via SSH.
- Updates the local workspace compose tag environment parameters.
- Re-starts containers, fetches updated container images, and executes curl probes confirming `/api/health/ready` returns HTTP 200.
- Reverts deployment target to previous image tag if health check fails.

## Required Secrets on Repository
Make sure to register these secrets under GitHub Repository settings:
- `PROD_SSH_HOST` — Production VPS IP address or host name.
- `PROD_SSH_USER` — SSH terminal username (e.g. `ubuntu`).
- `PROD_SSH_PRIVATE_KEY` — Private key corresponding to host authorized keys.
