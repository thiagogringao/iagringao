# Script para fazer upload do código para a VPS
# Execute este script no PowerShell do Windows

$VPS_IP = "72.60.250.20"
$VPS_USER = "root"
$VPS_PATH = "/var/www/joalheria-analytics-3001"
$LOCAL_PATH = "C:\Users\thiag\Documents\gringao\aigringao\joalheria-analytics"

Write-Host "🚀 Upload para VPS - Joalheria Analytics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o SCP está disponível
if (!(Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Host "❌ SCP não encontrado. Instale o OpenSSH Client." -ForegroundColor Red
    Write-Host "   Settings > Apps > Optional Features > OpenSSH Client" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Fazendo upload dos arquivos..." -ForegroundColor Yellow
Write-Host "   De: $LOCAL_PATH" -ForegroundColor Gray
Write-Host "   Para: ${VPS_USER}@${VPS_IP}:${VPS_PATH}" -ForegroundColor Gray
Write-Host ""

# Criar arquivo temporário com lista de exclusões
$excludeFile = Join-Path $env:TEMP "rsync-exclude.txt"
@"
node_modules/
client/node_modules/
dist/
client/dist/
logs/
*.log
.git/
.env
.env.local
*.db
*.db-journal
"@ | Out-File -FilePath $excludeFile -Encoding UTF8

# Usar SCP para fazer upload (excluindo node_modules e outros)
Write-Host "⏳ Fazendo upload... (isso pode demorar alguns minutos)" -ForegroundColor Yellow

# Criar diretório na VPS se não existir
ssh "${VPS_USER}@${VPS_IP}" "mkdir -p ${VPS_PATH}"

# Upload dos arquivos (exceto node_modules, dist, etc)
scp -r `
    -o "StrictHostKeyChecking=no" `
    "${LOCAL_PATH}\*" `
    "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Upload concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Conecte na VPS: ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor White
    Write-Host "   2. Vá para o diretório: cd ${VPS_PATH}" -ForegroundColor White
    Write-Host "   3. Execute o deploy: ./deploy-vps.sh" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erro no upload!" -ForegroundColor Red
    Write-Host "   Verifique a conexão com a VPS e tente novamente." -ForegroundColor Yellow
    exit 1
}

# Limpar arquivo temporário
Remove-Item $excludeFile -ErrorAction SilentlyContinue
