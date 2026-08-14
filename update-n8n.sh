#!/bin/bash
# Construit le nœud depuis les sources et l'installe dans n8n.
set -e

REPO_DIR="$HOME/dev/n8n-nodes-vikunja"
N8N_DIR="$HOME/docker/n8n"
NODES_DIR="$N8N_DIR/data/nodes/node_modules"
PACKAGE="n8n-nodes-vikunja"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$REPO_DIR"

echo -e "${YELLOW}Installation des dépendances...${NC}"
npm install --silent

echo -e "${YELLOW}Build...${NC}"
npm run build

echo -e "${YELLOW}Création du package...${NC}"
TARBALL=$(npm pack 2>&1 | tail -1)
echo "  → $TARBALL"

echo -e "${YELLOW}Arrêt de n8n...${NC}"
cd "$N8N_DIR" && docker compose stop

# Extraction directe plutôt que `npm install` : le paquet n'a aucune dépendance
# d'exécution, et n8n charge les nœuds depuis le dossier sans passer par npm.
echo -e "${YELLOW}Installation dans $NODES_DIR...${NC}"
rm -rf "${NODES_DIR:?}/$PACKAGE"
mkdir -p "$NODES_DIR/$PACKAGE"
tar xzf "$REPO_DIR/$TARBALL" -C "$NODES_DIR/$PACKAGE" --strip-components=1
cp "$REPO_DIR/$TARBALL" "$N8N_DIR/data/"
rm "$REPO_DIR/$TARBALL"

VERSION=$(node -p "require('$NODES_DIR/$PACKAGE/package.json').version")
sqlite3 "$N8N_DIR/data/database.sqlite" \
  "UPDATE installed_packages SET installedVersion='$VERSION', updatedAt=datetime('now') WHERE packageName='$PACKAGE';"

echo -e "${YELLOW}Redémarrage de n8n...${NC}"
docker compose up -d
sleep 15
docker compose logs --tail=5 2>&1 | grep -iE "version:|editor|vikunja|error" || true

echo ""
echo -e "${GREEN}$PACKAGE $VERSION installé.${NC}"
