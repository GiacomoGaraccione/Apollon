#!/bin/bash
set -e  # exit immediately if a command exits with a non-zero status

echo "Stopping existing container..."
sudo docker stop se-modeler-client || true

echo "Removing existing container..."
sudo docker rm se-modeler-client || true

echo "Pulling latest image..."
sudo docker pull giacomogaraccione/se-modeler-client:latest

echo "Running container..."
sudo docker run -d --restart always -p 127.0.0.1:33301:3000 --name se-modeler-client --network se-modeler-network giacomogaraccione/se-modeler-client:latest

echo "Done. Container 'se-modeler-client' is running."