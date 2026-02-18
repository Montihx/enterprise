#!/usr/bin/env bash
# ============================================================
# Kitsu Enterprise — Local Network Setup Script
# ============================================================
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  Kitsu Enterprise — Local Network Setup  ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check required tools
for cmd in docker docker-compose-v1 curl; do
  if ! command -v docker &>/dev/null; then
    echo -e "${RED}✗ Docker is not installed. Please install Docker Desktop.${NC}"
    echo "  Visit: https://docs.docker.com/get-docker/"
    exit 1
  fi
done

# Get local IP
HOST_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ipconfig getifaddr en0 2>/dev/null || echo "localhost")
echo -e "${GREEN}✓ Local IP detected: ${HOST_IP}${NC}"

# Write .env.local for frontend
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://${HOST_IP}:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://${HOST_IP}:8000/api/v1
EOF
echo -e "${GREEN}✓ Frontend .env.local configured${NC}"

# Write backend .env if not present
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env 2>/dev/null || cat > backend/.env << EOF
DATABASE_URL=postgresql+asyncpg://kitsu:devpassword@localhost:5432/kitsu
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=$(openssl rand -hex 32)
API_ENV=development
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://${HOST_IP}:3000"]
EOF
  echo -e "${GREEN}✓ Backend .env created${NC}"
else
  echo -e "${YELLOW}ℹ backend/.env already exists, skipping${NC}"
fi

echo ""
echo -e "${CYAN}Starting services...${NC}"

# Start with docker compose
docker compose up -d --build

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${CYAN}Access from this machine:${NC}"
echo -e "  → Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  → API:      ${GREEN}http://localhost:8000${NC}"
echo -e "  → API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "  ${CYAN}Access from other devices on your network:${NC}"
echo -e "  → Frontend: ${GREEN}http://${HOST_IP}:3000${NC}"
echo -e "  → API:      ${GREEN}http://${HOST_IP}:8000${NC}"
echo ""
echo -e "  ${YELLOW}Default admin credentials:${NC}"
echo -e "  → Email:    admin@kitsu.io"
echo -e "  → Password: admin123 (change after first login!)"
echo ""
echo -e "  Run ${CYAN}make migrate && make seed${NC} to initialize the database."
echo ""
