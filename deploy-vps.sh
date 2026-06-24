#!/bin/bash
# DocForge VPS Auto-Deployment Script
# Safe to run on Ubuntu / Debian VPS

set -e

echo "=== 🚀 DocForge VPS Deployment Started ==="

# 1. Update system packages
echo "Updating package lists..."
sudo apt-get update -y

# 2. Install Git & Curl
echo "Installing Git, Curl..."
sudo apt-get install -y git curl

# 3. Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker is already installed."
fi

# 4. Install Docker Compose if not already installed
if ! command -v docker compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo apt-get install -y docker-compose-plugin
else
    echo "Docker Compose is already installed."
fi

# 5. Clone/Go to DocForge folder
# Note: If you already have the folder on your VPS, you can run this script inside it.
if [ ! -d "docforge" ]; then
    echo "Please make sure to run this script inside the cloned 'docforge' directory."
    echo "Alternatively, clone the repository now:"
    echo "git clone <YOUR_GITHUB_REPO_URL> docforge"
    echo "cd docforge"
fi

echo "=== 🐳 Building & Running DocForge Container ==="
# Start the production-specific docker compose
sudo docker compose -f docker-compose.prod.yml up --build -d

echo "=== ✅ Deployment Complete! ==="
echo "DocForge Server is now online at http://ip.lubu.biz.id/docforge"
echo "You can check status using: sudo docker compose -f docker-compose.prod.yml ps"
