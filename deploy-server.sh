#!/bin/bash
set -e  # exit immediately if a command exits with a non-zero status

echo "Stopping existing container..."
sudo docker stop se-modeler-server || true

echo "Removing existing container..."
sudo docker rm se-modeler-server || true

echo "Pulling latest image..."
sudo docker pull giacomogaraccione/se-modeler-server:latest

echo "Running container..."
sudo docker run -d --restart always -p 33300:5000 --name se-modeler-server -v se-modeler-db:/app/database  --network se-modeler-network giacomogaraccione/se-modeler-server:latest

echo "Done. Container 'se-modeler-server' is running."