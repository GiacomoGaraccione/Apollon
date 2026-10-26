#!/bin/bash
set -e

# Su Git Bash/MSYS (Windows) gli argomenti che iniziano per "/" vengono
# riscritti in path Windows prima di arrivare a docker (es. /uml-modeler-staging
# diventa C:/Program Files/Git/uml-modeler-staging). Questo disabilita quella
# conversione; è un no-op su Linux/macOS.
export MSYS_NO_PATHCONV=1

IMAGE_NAME="giacomogaraccione/se-modeler-client"
TAG="staging"

echo "🚀 Building Docker image: $IMAGE_NAME:$TAG"
docker build --build-arg PUBLIC_URL=/uml-modeler-staging --build-arg API_BASE_PATH=/uml-modeler-staging-server -t $IMAGE_NAME:$TAG .

echo "📤 Pushing image to Docker Hub: $IMAGE_NAME:$TAG"
docker push $IMAGE_NAME:$TAG

echo "✅ Done!"
