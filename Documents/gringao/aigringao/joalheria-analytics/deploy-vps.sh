#!/bin/bash

# Script de Deploy para VPS - Joalheria Analytics
# Porta: 3001

set -e

echo "🚀 Deploy Joalheria Analytics - Porta 3001"
echo "=========================================="
echo ""

# 1. Atualizar código
echo "📥 Atualizando código..."
git pull origin main || git pull origin master

# 2. Instalar dependências
echo "📦 Instalando dependências..."
npm install --production=false

# 3. Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd client
npm install
cd ..

# 4. Build do frontend
echo "🏗️  Build do frontend..."
cd client
npm run build
cd ..

# 5. Build do backend
echo "🏗️  Build do backend..."
npm run build:server

# 6. Criar diretório de logs
mkdir -p logs

# 7. Criar usuário admin
echo "👤 Criando usuário admin..."
npx tsx scripts/create-admin.ts || echo "Usuário admin já existe"

# 8. Reiniciar com PM2
echo "🔄 Reiniciando aplicação..."
if pm2 list | grep -q "joalheria-analytics-3001"; then
    pm2 restart joalheria-analytics-3001
else
    pm2 start ecosystem.config.js --env production
    pm2 save
fi

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Aplicação rodando em: http://72.60.250.20:3001"
echo "📝 Ver logs: pm2 logs joalheria-analytics-3001"
