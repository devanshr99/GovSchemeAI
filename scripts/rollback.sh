#!/usr/bin/env bash
# ==============================================================================
# YojanaAI Production Container Rollback Script
# ==============================================================================
set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <target_image_tag>"
    exit 1
fi

TAG=$1
echo "==== Reverting YojanaAI Deployment to Tag: ${TAG} ===="

# Export IMAGE_TAG for docker-compose interpolation
export IMAGE_TAG=${TAG}

# Pull and restart containers under the previous tag
docker compose pull backend frontend worker scheduler
docker compose up -d --remove-orphans

echo "Rollback initiated. Checking service health..."
sleep 5
docker compose ps
echo "====================================================="
