#!/bin/bash
set -e  # exit immediately if a command exits with a non-zero status

echo "Stopping existing container..."
sudo docker stop se-modeler-server-staging || true

echo "Removing existing container..."
sudo docker rm se-modeler-server-staging || true

echo "Pulling latest image..."
sudo docker pull giacomogaraccione/se-modeler-server:staging

echo "Running container..."
sudo docker run -d --restart always -p 33310:5000 --name se-modeler-server-staging -v se-modeler-db-staging:/app/database --network se-modeler-network giacomogaraccione/se-modeler-server:staging

echo "Done. Container 'se-modeler-server-staging' is running."
