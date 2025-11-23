# Script para instalar Redis nativo no Windows
# Instala em local que nao precisa de permissoes de administrador

$ErrorActionPreference = "Continue"

Write-Host "Instalando Redis para Windows..." -ForegroundColor Cyan
Write-Host ""

# Instala em AppData (nao precisa de permissoes de admin)
$redisPath = "$env:LOCALAPPDATA\Redis"
$redisExe = "$redisPath\redis-server.exe"

if (Test-Path $redisExe) {
    Write-Host "Redis ja esta instalado em: $redisPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para iniciar o Redis, execute:" -ForegroundColor Yellow
    Write-Host "   Start-Process '$redisExe'" -ForegroundColor White
    Write-Host ""
    exit 0
}

# Cria diretorio de instalacao
$installDir = $redisPath
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

Write-Host "Baixando Redis para Windows..." -ForegroundColor Cyan
Write-Host ""

# URL do Redis para Windows
$redisUrl = "https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip"
$zipPath = "$env:TEMP\redis-windows.zip"
$extractPath = "$env:TEMP\redis-extract"

# Baixa o Redis
Write-Host "Baixando de: $redisUrl" -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $redisUrl -OutFile $zipPath -UseBasicParsing
    Write-Host "Download concluido!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Erro ao baixar Redis: $_" -ForegroundColor Red
    Write-Host "Tente baixar manualmente de: $redisUrl" -ForegroundColor Yellow
    exit 1
}

# Extrai o ZIP
Write-Host "Extraindo arquivos..." -ForegroundColor Cyan
try {
    if (Test-Path $extractPath) {
        Remove-Item $extractPath -Recurse -Force
    }
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
} catch {
    Write-Host "Erro ao extrair arquivos: $_" -ForegroundColor Red
    exit 1
}

# Copia arquivos para o diretorio de instalacao
Write-Host "Instalando Redis..." -ForegroundColor Cyan
try {
    $sourceDir = "$extractPath\Redis-x64-5.0.14.1"
    if (-not (Test-Path $sourceDir)) {
        Write-Host "Estrutura de diretorios inesperada" -ForegroundColor Red
        exit 1
    }
    
    $redisFiles = Get-ChildItem $sourceDir -Recurse
    
    foreach ($file in $redisFiles) {
        $destPath = $file.FullName.Replace($sourceDir, $installDir)
        $destDir = Split-Path $destPath -Parent
        
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item $file.FullName -Destination $destPath -Force
    }
    
    Write-Host "Redis instalado em: $installDir" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Erro ao instalar Redis: $_" -ForegroundColor Red
    exit 1
}

# Limpa arquivos temporarios
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Instalacao concluida!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "   1. Inicie o Redis: Start-Process '$redisExe'" -ForegroundColor White
Write-Host "   2. Configure REDIS_HOST no .env se necessario" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE: A aplicacao ja esta usando cache em memoria!" -ForegroundColor Yellow
Write-Host "O Redis e opcional para melhor performance." -ForegroundColor Yellow
Write-Host ""
