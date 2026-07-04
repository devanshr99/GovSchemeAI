# YojanaAI Rollback Guide

This guide describes the procedures for reverting deployment packages and database schemas in case of an incident.

## Container Version Rollback

If a bad build slips past testing, run the automated rollback script:

### Manual Rollback (From VPS Shell)
1. Log in to the production host terminal.
2. Navigate to the project directory:
   ```bash
   cd /app/yojana-ai
   ```
3. Run the rollback script providing the target stable image tag (e.g. git commit SHA or release version):
   ```bash
   ./scripts/rollback.sh v1.0.0
   ```

### CI/CD Triggered Rollback
Navigate to the GitHub Actions tab, select the **YojanaAI Production Deployment CI/CD** workflow, click **Run workflow**, and enter the target rollback tag value. The CD agent will automatically pull the tagged release and restart the container services.

---

## Database Rollback Guidelines

If schema migrations cause errors, perform a manual database restoration:
1. Revert active containers to a tag pre-migration.
2. Locate the latest stable compressed SQL dump inside the `./backups` directory (e.g. `backups/yojana_prod_backup_20260702_143000.sql.gz`).
3. Execute the database restore script to overwrite the current database container state:
   ```bash
   ./scripts/restore.sh ./backups/yojana_prod_backup_20260702_143000.sql.gz
   ```
