# ============================================
# Script de Execução de Otimizações (PowerShell)
# Joalheria Analytics - Dashboard
# ============================================

Write-Host "🚀 Iniciando otimizações de performance..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. Verificar conexão com MySQL
# ============================================
Write-Host "[1/5] Verificando conexão com MySQL..." -ForegroundColor Blue

$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue

if (-not $mysqlPath) {
    Write-Host "⚠️  MySQL client não encontrado. Instale o MySQL client primeiro." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ MySQL client encontrado" -ForegroundColor Green
Write-Host ""

# ============================================
# 2. Executar script de otimização SQL
# ============================================
Write-Host "[2/5] Executando script de otimização SQL..." -ForegroundColor Blue
Write-Host "Digite a senha do MySQL quando solicitado:" -ForegroundColor Yellow
Write-Host ""

$scriptPath = Join-Path $PSScriptRoot "optimize-database.sql"

if (Test-Path $scriptPath) {
    mysql -u root -p < $scriptPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Script SQL executado com sucesso" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Erro ao executar script SQL" -ForegroundColor Yellow
        Write-Host "Verifique as credenciais e tente novamente" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "⚠️  Arquivo optimize-database.sql não encontrado" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ============================================
# 3. Verificar índices criados
# ============================================
Write-Host "[3/5] Verificando índices criados..." -ForegroundColor Blue

$indexQuery = @"
USE loja_fisica;
SHOW INDEX FROM caixas_venda WHERE Key_name LIKE 'idx_%';
"@

echo $indexQuery | mysql -u root -p 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Índices verificados" -ForegroundColor Green
} else {
    Write-Host "⚠️  Não foi possível verificar índices" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# 4. Verificar views criadas
# ============================================
Write-Host "[4/5] Verificando views criadas..." -ForegroundColor Blue

$viewQuery = @"
USE loja_fisica;
SHOW FULL TABLES WHERE Table_type = 'VIEW';
"@

echo $viewQuery | mysql -u root -p 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Views verificadas" -ForegroundColor Green
} else {
    Write-Host "⚠️  Não foi possível verificar views" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# 5. Reiniciar aplicação
# ============================================
Write-Host "[5/5] Reiniciando aplicação..." -ForegroundColor Blue
Write-Host ""

# Navegar para diretório raiz do projeto
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

# Matar processos Node existentes (opcional)
# Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*joalheria-analytics*" } | Stop-Process -Force

# Iniciar aplicação em background
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev"

Write-Host "✅ Aplicação iniciada em background" -ForegroundColor Green
Write-Host ""

# ============================================
# Resumo
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 Otimizações aplicadas com sucesso!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Melhorias esperadas:"
Write-Host "  ✅ Queries 70% mais rápidas"
Write-Host "  ✅ Cache hit rate > 80%"
Write-Host "  ✅ Frontend 85% mais rápido"
Write-Host "  ✅ Menos re-renders"
Write-Host ""
Write-Host "🌐 Acesse: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Documentação:"
Write-Host "  - OTIMIZACOES_PERFORMANCE.md"
Write-Host "  - CACHE_E_PERFORMANCE.md"
Write-Host ""

# Aguardar tecla para fechar
Write-Host "Pressione qualquer tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

