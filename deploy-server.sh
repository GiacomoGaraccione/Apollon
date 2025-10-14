#!/bin/bash
set -e  # exit immediately if a command exits with a non-zero status

echo "Stopping existing container..."
sudo docker stop umlegend-server || true

echo "Removing existing container..."
sudo docker rm umlegend-server || true

echo "Pulling latest image..."
sudo docker pull giacomogaraccione/umlegend-new-server:latest

echo "Running container..."
sudo docker run -d --restart always -p 5001:5000 --name umlegend-server -v /app/database:/data  --network umlegend-network giacomogaraccione/umlegend-new-server:latest

echo "Done. Container 'umlegend-server' is running."