#!/bin/bash
set -e  # exit immediately if a command exits with a non-zero status

echo "Stopping existing container..."
sudo docker stop se-modeler-client-staging || true

echo "Removing existing container..."
sudo docker rm se-modeler-client-staging || true

echo "Pulling latest image..."
sudo docker pull giacomogaraccione/se-modeler-client:staging

echo "Running container..."
sudo docker run -d --restart always -p 127.0.0.1:33311:3000 --name se-modeler-client-staging --network se-modeler-network giacomogaraccione/se-modeler-client:staging

echo "Done. Container 'se-modeler-client-staging' is running."
