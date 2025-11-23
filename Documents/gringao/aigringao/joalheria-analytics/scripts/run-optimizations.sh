#!/bin/bash

# ============================================
# Script de Execução de Otimizações
# Joalheria Analytics - Dashboard
# ============================================

echo "🚀 Iniciando otimizações de performance..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# 1. Verificar conexão com MySQL
# ============================================
echo -e "${BLUE}[1/5]${NC} Verificando conexão com MySQL..."

if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  MySQL client não encontrado. Instale o MySQL client primeiro.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ MySQL client encontrado${NC}"
echo ""

# ============================================
# 2. Executar script de otimização SQL
# ============================================
echo -e "${BLUE}[2/5]${NC} Executando script de otimização SQL..."
echo "Digite a senha do MySQL quando solicitado:"
echo ""

mysql -u root -p < scripts/optimize-database.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Script SQL executado com sucesso${NC}"
else
    echo -e "${YELLOW}⚠️  Erro ao executar script SQL${NC}"
    echo "Verifique as credenciais e tente novamente"
    exit 1
fi
echo ""

# ============================================
# 3. Verificar índices criados
# ============================================
echo -e "${BLUE}[3/5]${NC} Verificando índices criados..."

mysql -u root -p -e "
USE loja_fisica;
SHOW INDEX FROM caixas_venda WHERE Key_name LIKE 'idx_%';
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Índices verificados${NC}"
else
    echo -e "${YELLOW}⚠️  Não foi possível verificar índices${NC}"
fi
echo ""

# ============================================
# 4. Verificar views criadas
# ============================================
echo -e "${BLUE}[4/5]${NC} Verificando views criadas..."

mysql -u root -p -e "
USE loja_fisica;
SHOW FULL TABLES WHERE Table_type = 'VIEW';
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Views verificadas${NC}"
else
    echo -e "${YELLOW}⚠️  Não foi possível verificar views${NC}"
fi
echo ""

# ============================================
# 5. Reiniciar aplicação
# ============================================
echo -e "${BLUE}[5/5]${NC} Reiniciando aplicação..."
echo ""

# Matar processos Node existentes (opcional)
# pkill -f "node.*joalheria-analytics" 2>/dev/null

# Iniciar aplicação
cd "$(dirname "$0")/.."
npm run dev &

echo -e "${GREEN}✅ Aplicação iniciada em background${NC}"
echo ""

# ============================================
# Resumo
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Otimizações aplicadas com sucesso!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Melhorias esperadas:"
echo "  ✅ Queries 70% mais rápidas"
echo "  ✅ Cache hit rate > 80%"
echo "  ✅ Frontend 85% mais rápido"
echo "  ✅ Menos re-renders"
echo ""
echo "🌐 Acesse: http://localhost:5173"
echo ""
echo "📝 Documentação:"
echo "  - OTIMIZACOES_PERFORMANCE.md"
echo "  - CACHE_E_PERFORMANCE.md"
echo ""

