#!/bin/bash
set -e  # exit immediately if a command exits with a non-zero status

# Run this BEFORE deploy-server-staging.sh. Same as backup-server.sh but for the staging
# container/image/volume - see that script for the full explanation.
#
# Usage: ./backup-server-staging.sh [backup-root-dir]
#   backup-root-dir defaults to ./backups

TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_DIR="${1:-./backups}/server-staging-$TIMESTAMP"
IMAGE="giacomogaraccione/se-modeler-server"
CONTAINER="se-modeler-server-staging"
DB_PATH_IN_CONTAINER="/app/database/modeler.db"
BACKUP_PATH_IN_CONTAINER="/app/database/modeler-backup-$TIMESTAMP.db"

mkdir -p "$BACKUP_DIR"

echo "Tagging current image as $IMAGE:backup-staging-$TIMESTAMP..."
if sudo docker image inspect "$IMAGE:staging" > /dev/null 2>&1; then
    sudo docker tag "$IMAGE:staging" "$IMAGE:backup-staging-$TIMESTAMP"
    echo "  -> done. To roll back: re-run the 'docker run' line from deploy-server-staging.sh by hand, using $IMAGE:backup-staging-$TIMESTAMP instead of :staging (skip the 'docker pull' step)."
else
    echo "  -> WARNING: $IMAGE:staging not found locally, nothing to tag yet (first deploy?)."
fi

echo "Backing up the database..."
if sudo docker inspect "$CONTAINER" > /dev/null 2>&1; then
    sudo docker exec "$CONTAINER" python3 -c "
import sqlite3
src = sqlite3.connect('$DB_PATH_IN_CONTAINER')
dst = sqlite3.connect('$BACKUP_PATH_IN_CONTAINER')
src.backup(dst)
dst.close()
src.close()
"
    sudo docker cp "$CONTAINER:$BACKUP_PATH_IN_CONTAINER" "$BACKUP_DIR/modeler-backup-$TIMESTAMP.db"
    sudo docker exec "$CONTAINER" rm "$BACKUP_PATH_IN_CONTAINER"
    echo "  -> saved to $BACKUP_DIR/modeler-backup-$TIMESTAMP.db"
else
    echo "  -> WARNING: container '$CONTAINER' not found/running, nothing to back up yet."
fi

echo "Done. Backup folder: $BACKUP_DIR"
