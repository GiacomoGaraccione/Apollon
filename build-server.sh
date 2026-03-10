#!/bin/bash
set -e

IMAGE_NAME="giacomogaraccione/se-modeler-server"
TAG="latest"

echo "🚀 Building Docker image: $IMAGE_NAME:$TAG"
docker build -t $IMAGE_NAME:$TAG ./server

echo "📤 Pushing image to Docker Hub: $IMAGE_NAME:$TAG"
docker push $IMAGE_NAME:$TAG

echo "✅ Done!"
