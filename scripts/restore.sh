#!/usr/bin/env bash
# ==============================================================================
# YojanaAI Production PostgreSQL Restore Script
# ==============================================================================
set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file ${BACKUP_FILE} not found!"
    exit 1
fi

echo "==== Starting YojanaAI Production Database Restore ===="
echo "Restoring from: ${BACKUP_FILE}"

# Read target file contents, gunzip, and pipe to psql inside the database container
gunzip -c "${BACKUP_FILE}" | docker exec -i yojana-database psql -U yojana -d yojana

echo "Database restore completed successfully!"
echo "====================================================="
