#!/bin/bash

# Script de Deploy Automático - Joalheria Analytics
# Execute este script na VPS para fazer deploy da aplicação

set -e  # Para em caso de erro

echo "🚀 Iniciando deploy da Joalheria Analytics..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para printar com cor
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    print_error "Erro: package.json não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
fi

print_success "Diretório verificado"

# 2. Pull do código (se for repositório git)
if [ -d ".git" ]; then
    echo "📥 Atualizando código do repositório..."
    git pull origin main || git pull origin master
    print_success "Código atualizado"
else
    print_warning "Não é um repositório git. Pulando pull..."
fi

# 3. Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
npm install --production=false
print_success "Dependências do backend instaladas"

# 4. Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd client
npm install
cd ..
print_success "Dependências do frontend instaladas"

# 5. Build do frontend
echo "🏗️  Fazendo build do frontend..."
cd client
npm run build
cd ..
print_success "Build do frontend concluído"

# 6. Build do backend
echo "🏗️  Fazendo build do backend..."
npm run build:server
print_success "Build do backend concluído"

# 7. Criar diretório de logs se não existir
mkdir -p logs
print_success "Diretório de logs criado"

# 8. Reiniciar aplicação com PM2
echo "🔄 Reiniciando aplicação..."
if pm2 list | grep -q "joalheria-analytics"; then
    pm2 restart joalheria-analytics
    print_success "Aplicação reiniciada"
else
    pm2 start ecosystem.config.js
    pm2 save
    print_success "Aplicação iniciada"
fi

# 9. Mostrar status
echo ""
echo "📊 Status da aplicação:"
pm2 status joalheria-analytics

echo ""
print_success "Deploy concluído com sucesso!"
echo ""
echo "🌐 Acesse a aplicação em: https://seu-dominio.com"
echo "📝 Ver logs: pm2 logs joalheria-analytics"
echo "📊 Monitorar: pm2 monit"
echo ""
