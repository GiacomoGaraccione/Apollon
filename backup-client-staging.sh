#!/bin/bash
set -e  # exit immediately if a command exits with a non-zero status

# Run this BEFORE deploy-client-staging.sh. Same as backup-client.sh but for the staging image -
# see that script for the full explanation (stateless container, image tag only).
#
# Usage: ./backup-client-staging.sh

TIMESTAMP=$(date +%Y%m%d%H%M%S)
IMAGE="giacomogaraccione/se-modeler-client"

echo "Tagging current image as $IMAGE:backup-staging-$TIMESTAMP..."
if sudo docker image inspect "$IMAGE:staging" > /dev/null 2>&1; then
    sudo docker tag "$IMAGE:staging" "$IMAGE:backup-staging-$TIMESTAMP"
    echo "  -> done. To roll back: re-run the 'docker run' line from deploy-client-staging.sh by hand, using $IMAGE:backup-staging-$TIMESTAMP instead of :staging (skip the 'docker pull' step)."
else
    echo "  -> WARNING: $IMAGE:staging not found locally, nothing to tag yet (first deploy?)."
fi

echo "Done."
