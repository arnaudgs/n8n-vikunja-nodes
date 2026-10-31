#!/bin/bash
# Met à jour le node Vikunja dans n8n depuis les sources git
set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
N8N_DATA="$HOME/docker/n8n/data"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$REPO_DIR"

echo -e "${YELLOW}Pull des dernières modifications...${NC}"
git pull

echo -e "${YELLOW}Installation des dépendances...${NC}"
npm install --silent

echo -e "${YELLOW}Build...${NC}"
npm run build

echo -e "${YELLOW}Création du package...${NC}"
TARBALL=$(npm pack 2>&1 | tail -1)
echo "  → $TARBALL"

echo -e "${YELLOW}Copie dans n8n...${NC}"
cp "$TARBALL" "$N8N_DATA/"
rm "$TARBALL"

echo -e "${YELLOW}Installation dans le conteneur n8n...${NC}"
docker exec n8n sh -c "cd /home/node/.n8n/nodes && npm install /home/node/.n8n/$TARBALL" 2>&1

echo -e "${YELLOW}Redémarrage de n8n...${NC}"
cd "$HOME/docker/n8n" && docker compose restart

sleep 8
echo ""
docker compose logs --tail=5 2>&1 | grep -E "Version:|Editor|vikunja" -i
echo ""
echo -e "${GREEN}Vikunja nodes mis à jour.${NC}"
