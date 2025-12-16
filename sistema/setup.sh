#!/bin/bash

# ============================================
# Setup Automático - Avoar Sistema
# Para macOS/Linux
# ============================================

set -e

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   🚀 Setup Avoar Sistema - macOS/Linux    ║"
echo "║      Configuração Automática de Deps      ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} $2 encontrado"
        $1 --version | head -n 1
        return 0
    else
        echo -e "${RED}[ERRO]${NC} $2 não encontrado"
        return 1
    fi
}

# Verificações
echo -e "${BLUE}[INFO]${NC} Verificando Node.js..."
check_command "node" "Node.js" || { echo "Baixe em: https://nodejs.org/"; exit 1; }
echo ""

echo -e "${BLUE}[INFO]${NC} Verificando npm..."
check_command "npm" "npm" || { exit 1; }
echo ""

echo -e "${BLUE}[INFO]${NC} Verificando PostgreSQL..."
if ! check_command "psql" "PostgreSQL"; then
    echo -e "${YELLOW}[AVISO]${NC} PostgreSQL não encontrado"
    echo -e "${BLUE}[INFO]${NC} Instale com:"
    echo "  macOS: brew install postgresql"
    echo "  Linux: sudo apt install postgresql postgresql-contrib"
    echo ""
    echo "Deseja continuar? (s/n)"
    read -r response
    if [ "$response" != "s" ]; then
        exit 1
    fi
fi
echo ""

# Instalar dependências
echo "════════════════════════════════════════════"
echo "Instalando Dependências NPM..."
echo "════════════════════════════════════════════"
echo ""

npm install

echo ""
echo "════════════════════════════════════════════"
echo -e "${GREEN}✅ Setup Concluído!${NC}"
echo "════════════════════════════════════════════"
echo ""
echo "📋 Próximas Etapas:"
echo ""
echo "1. Criar arquivo .env.local com:"
echo "   - Credenciais PostgreSQL"
echo "   - JWT_SECRET"
echo ""
echo "   Copie de .env.example ou use:"
echo "   DB_USER=postgres"
echo "   DB_PASSWORD=postgres"
echo "   DB_HOST=localhost"
echo "   DB_PORT=5432"
echo "   DB_NAME=avoar_db"
echo "   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/avoar_db"
echo "   JWT_SECRET=seu-secret-aqui"
echo ""
echo "2. Criar banco de dados:"
echo "   psql -U postgres -c \"CREATE DATABASE avoar_db;\""
echo ""
echo "3. Executar schema SQL:"
echo "   psql -U postgres -d avoar_db < lib/db/schema.sql"
echo ""
echo "4. Testar conexão:"
echo "   npx ts-node lib/db/test-connection.ts"
echo ""
echo "5. Rodar em desenvolvimento:"
echo "   npm run dev"
echo ""
echo "6. Acessar: http://localhost:3000"
echo ""
echo "════════════════════════════════════════════"
echo ""

