#! /bin/bash

echo "Nginx config is stored in /etc/nginx/conf.d/apps.conf"

sudo nginx -t
sudo systemctl restart nginx