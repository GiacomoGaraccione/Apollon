#!/bin/bash
set -e  # exit immediately if a command exits with a non-zero status

# Run this BEFORE deploy-server.sh, so there's a way back if the new image/dependencies cause
# problems. Safe to run even on a fresh host where nothing is deployed yet - each step just prints
# a warning and skips if there's nothing to back up.
#
# Usage: ./backup-server.sh [backup-root-dir]
#   backup-root-dir defaults to ./backups

TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_DIR="${1:-./backups}/server-$TIMESTAMP"
IMAGE="giacomogaraccione/se-modeler-server"
CONTAINER="se-modeler-server"
DB_PATH_IN_CONTAINER="/app/database/modeler.db"
BACKUP_PATH_IN_CONTAINER="/app/database/modeler-backup-$TIMESTAMP.db"

mkdir -p "$BACKUP_DIR"

echo "Tagging current image as $IMAGE:backup-$TIMESTAMP..."
if sudo docker image inspect "$IMAGE:latest" > /dev/null 2>&1; then
    sudo docker tag "$IMAGE:latest" "$IMAGE:backup-$TIMESTAMP"
    echo "  -> done. To roll back: re-run the 'docker run' line from deploy-server.sh by hand, using $IMAGE:backup-$TIMESTAMP instead of :latest (skip the 'docker pull' step)."
else
    echo "  -> WARNING: $IMAGE:latest not found locally, nothing to tag yet (first deploy?)."
fi

echo "Backing up the database..."
if sudo docker inspect "$CONTAINER" > /dev/null 2>&1; then
    # Use Python's own sqlite3 module (already inside the image - no extra CLI tool required) for a
    # consistent online backup, rather than a raw file copy that could catch a half-written state
    # if the server is writing to the database at the exact moment this runs.
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
