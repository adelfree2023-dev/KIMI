#!/bin/bash
# Apex v2 - Server Provisioning Script
# Compatible with Ubuntu 22.04 LTS
# Run as root (sudo su)

set -e

echo "🚀 Starting Apex v2 Server Provisioning..."

# 1. Update System
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y
apt-get install -y curl unzip git jq tree

# 2. Install Docker & Docker Compose
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# 3. Install Bun
echo "🥯 Installing Bun..."
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    # Add to path for this session
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    echo "✅ Bun installed"
else
    echo "✅ Bun already installed"
fi

# 4. Prepare Directories
echo "ZE Creating project directories..."
mkdir -p /opt/apex-v2
chown -R $USER:$USER /opt/apex-v2

# 5. Firewall Setup (UFW)
echo "🛡️ Configuring Firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp # Traefik Dashboard (secured)
ufw --force enable

echo "✅ Server Provisioning Complete!"
echo "➡️  Next Step: Run 'deploy.sh' from your local machine."
