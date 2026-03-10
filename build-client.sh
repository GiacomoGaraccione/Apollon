#!/bin/bash
set -e

IMAGE_NAME="giacomogaraccione/se-modeler-client"
TAG="latest"

echo "🚀 Building Docker image: $IMAGE_NAME:$TAG"
docker build --build-arg PUBLIC_URL=/uml-modeler -t $IMAGE_NAME:$TAG .

echo "📤 Pushing image to Docker Hub: $IMAGE_NAME:$TAG"
docker push $IMAGE_NAME:$TAG

echo "✅ Done!"
