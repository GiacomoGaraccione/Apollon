#!/bin/bash
set -e

# Su Git Bash/MSYS (Windows) gli argomenti che iniziano per "/" vengono
# riscritti in path Windows prima di arrivare a docker (es. /uml-modeler
# diventa C:/Program Files/Git/uml-modeler). Questo disabilita quella
# conversione; è un no-op su Linux/macOS.
export MSYS_NO_PATHCONV=1

IMAGE_NAME="giacomogaraccione/se-modeler-client"
TAG="latest"

echo "🚀 Building Docker image: $IMAGE_NAME:$TAG"
docker build --build-arg PUBLIC_URL=/uml-modeler -t $IMAGE_NAME:$TAG .

echo "📤 Pushing image to Docker Hub: $IMAGE_NAME:$TAG"
docker push $IMAGE_NAME:$TAG

echo "✅ Done!"
