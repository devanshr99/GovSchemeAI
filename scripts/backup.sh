#!/usr/bin/env bash
# ==============================================================================
# YojanaAI Production PostgreSQL Backup Script
# ==============================================================================
set -euo pipefail

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/yojana_prod_backup_${TIMESTAMP}.sql.gz"

echo "==== Starting YojanaAI Production Database Backup ===="

# Create backup folder if not exists
mkdir -p "${BACKUP_DIR}"

# Run pg_dump within the database container and pipe to gzip
docker exec -t yojana-database pg_dump -U yojana -d yojana | gzip > "${BACKUP_FILE}"

echo "Database backup completed successfully!"
echo "Saved to: ${BACKUP_FILE}"
echo "File Size: $(du -sh "${BACKUP_FILE}" | cut -f1)"
echo "====================================================="
