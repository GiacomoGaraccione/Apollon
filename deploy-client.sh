#!/bin/bash
set -e  # exit immediately if a command exits with a non-zero status

echo "Stopping existing container..."
sudo docker stop umlegend-client || true

echo "Removing existing container..."
sudo docker rm umlegend-client || true

echo "Pulling latest image..."
sudo docker pull giacomogaraccione/umlegend-new-client:latest

echo "Running container..."
sudo docker run -d --restart always -p 127.0.0.1:5000:3000 --name umlegend-client --network umlegend-network giacomogaraccione/umlegend-new-client:latest

echo "Done. Container 'umlegend-client' is running."