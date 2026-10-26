#!/bin/bash
set -e  # exit immediately if a command exits with a non-zero status

# Run this BEFORE deploy-client.sh. The client container is stateless (just serves the built
# static files), so there's no database to back up here - only the image tag, so you can roll back
# to the currently-running build if the new one has a problem.
#
# Usage: ./backup-client.sh

TIMESTAMP=$(date +%Y%m%d%H%M%S)
IMAGE="giacomogaraccione/se-modeler-client"

echo "Tagging current image as $IMAGE:backup-$TIMESTAMP..."
if sudo docker image inspect "$IMAGE:latest" > /dev/null 2>&1; then
    sudo docker tag "$IMAGE:latest" "$IMAGE:backup-$TIMESTAMP"
    echo "  -> done. To roll back: re-run the 'docker run' line from deploy-client.sh by hand, using $IMAGE:backup-$TIMESTAMP instead of :latest (skip the 'docker pull' step)."
else
    echo "  -> WARNING: $IMAGE:latest not found locally, nothing to tag yet (first deploy?)."
fi

echo "Done."
