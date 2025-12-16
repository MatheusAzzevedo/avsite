#!/bin/bash

# ============================================
# Iniciar Servidores - Avoar Site
# ============================================

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   🚀 Iniciando Servidores Avoar Site       ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "[ERRO] Node.js não encontrado!"
    echo "[INFO] Instale em: https://nodejs.org/"
    exit 1
fi

# Verificar se porta 3000 está livre
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[AVISO] Porta 3000 já está em uso!"
    echo "[INFO] Parando processo anterior..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Verificar se porta 3001 está livre
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[AVISO] Porta 3001 já está em uso!"
    echo "[INFO] Parando processo anterior..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 2
fi

echo "[INFO] Iniciando Next.js na porta 3001..."
cd sistema && npm run dev -- -p 3001 &
NEXTJS_PID=$!

sleep 3

echo "[INFO] Iniciando servidor estático na porta 3000..."
cd .. && node servidor-estatico.js &
STATIC_PID=$!

sleep 2

echo ""
echo "════════════════════════════════════════════"
echo "✅ Servidores Iniciados!"
echo "════════════════════════════════════════════"
echo ""
echo "📄 Site Estático: http://localhost:3000"
echo "🔐 Sistema Admin: http://localhost:3000/admin/login"
echo ""
echo "⏹️  Para parar: Pressione Ctrl+C ou execute:"
echo "   kill $NEXTJS_PID $STATIC_PID"
echo ""

wait

