# YojanaAI Production Checklist

Before launching YojanaAI to production, complete the following checklists.

## 1. Secrets Management & Environment Configuration
- [ ] Database credentials (`DATABASE_URL`, `POSTGRES_PASSWORD`) updated from defaults.
- [ ] Session security key (`JWT_SECRET`) set to a cryptographically secure 32-byte hex key.
- [ ] Production LLM Keys (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`) registered in secret vault.
- [ ] Debug mode (`DEBUG`) set to `False`.

## 2. Infrastructure & Networking
- [ ] Nginx ports `80` and `443` open on firewalls.
- [ ] Nginx pointing to valid Let's Encrypt certificates.
- [ ] Host memory and CPU limits configured for database and backend services.

## 3. Operations & Reliability
- [ ] Periodic backups script (`scripts/backup.sh`) set up as a system cron job (e.g. daily at 3 AM).
- [ ] Disk space monitoring set up for database volume mounts.
- [ ] Health checks (/api/health/ready) hooked into a monitoring service (e.g., Uptime Robot, Datadog).
- [ ] Slack webhook configured to notify administrative emails on startup/shutdown incidents.

## 4. Diagnostics & Auditing
- [ ] JSON logging enabled (`DEBUG=False` active).
- [ ] Prometheus metrics configuration verified at `:9090`.
- [ ] Grafana administration default password changed.
