# Script para instalar e iniciar Redis via Docker
# Autor: Sistema de Analytics
# Data: 2025

Write-Host "🚀 Instalando Redis via Docker..." -ForegroundColor Cyan
Write-Host ""

# Verifica se o Docker está instalado
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if (-not $dockerInstalled) {
    Write-Host "❌ Docker não está instalado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Por favor, instale o Docker Desktop:" -ForegroundColor Yellow
    Write-Host "   https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Após instalar, execute este script novamente." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker encontrado!" -ForegroundColor Green
Write-Host ""

# Verifica se o Docker está rodando
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker não está rodando!" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Por favor, inicie o Docker Desktop e tente novamente." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao verificar Docker: $_" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker está rodando!" -ForegroundColor Green
Write-Host ""

# Verifica se o container Redis já existe
$redisContainer = docker ps -a --filter "name=redis-cache" --format "{{.Names}}" 2>&1

if ($redisContainer -eq "redis-cache") {
    Write-Host "📦 Container Redis já existe!" -ForegroundColor Yellow
    
    # Verifica se está rodando
    $redisRunning = docker ps --filter "name=redis-cache" --format "{{.Names}}" 2>&1
    
    if ($redisRunning -eq "redis-cache") {
        Write-Host "✅ Redis já está rodando!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🧪 Testando conexão..." -ForegroundColor Cyan
        $pingResult = docker exec redis-cache redis-cli ping 2>&1
        if ($pingResult -eq "PONG") {
            Write-Host "✅ Redis está funcionando perfeitamente!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 Pronto! O Redis está configurado e rodando." -ForegroundColor Green
            Write-Host ""
            Write-Host "Agora você pode reiniciar o servidor da aplicação:" -ForegroundColor Cyan
            Write-Host "   npm run dev:server" -ForegroundColor Yellow
            exit 0
        } else {
            Write-Host "⚠️  Redis está rodando, mas não respondeu ao ping." -ForegroundColor Yellow
            Write-Host "   Tentando reiniciar o container..." -ForegroundColor Yellow
            docker restart redis-cache
            Start-Sleep -Seconds 2
            $pingResult = docker exec redis-cache redis-cli ping 2>&1
            if ($pingResult -eq "PONG") {
                Write-Host "✅ Redis reiniciado e funcionando!" -ForegroundColor Green
                exit 0
            }
        }
    } else {
        Write-Host "🔄 Iniciando container Redis..." -ForegroundColor Cyan
        docker start redis-cache
        Start-Sleep -Seconds 2
        
        $pingResult = docker exec redis-cache redis-cli ping 2>&1
        if ($pingResult -eq "PONG") {
            Write-Host "✅ Redis iniciado com sucesso!" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "❌ Erro ao iniciar Redis." -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "📦 Criando novo container Redis..." -ForegroundColor Cyan
    Write-Host ""
    
    # Cria e inicia o container Redis
    $createResult = docker run -d --name redis-cache -p 6379:6379 redis:alpine 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Container Redis criado!" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "⏳ Aguardando Redis inicializar..." -ForegroundColor Cyan
        Start-Sleep -Seconds 3
        
        Write-Host "🧪 Testando conexão..." -ForegroundColor Cyan
        $pingResult = docker exec redis-cache redis-cli ping 2>&1
        
        if ($pingResult -eq "PONG") {
            Write-Host "✅ Redis está funcionando perfeitamente!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 Pronto! O Redis está configurado e rodando." -ForegroundColor Green
            Write-Host ""
            Write-Host "Agora você pode reiniciar o servidor da aplicação:" -ForegroundColor Cyan
            Write-Host "   npm run dev:server" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "📊 Informações do Redis:" -ForegroundColor Cyan
            Write-Host "   Host: localhost" -ForegroundColor White
            Write-Host "   Porta: 6379" -ForegroundColor White
            Write-Host "   Container: redis-cache" -ForegroundColor White
            exit 0
        } else {
            Write-Host "⚠️  Redis foi criado, mas não respondeu ao ping ainda." -ForegroundColor Yellow
            Write-Host "   Aguarde alguns segundos e tente novamente." -ForegroundColor Yellow
            Write-Host "   Ou execute: docker exec redis-cache redis-cli ping" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "❌ Erro ao criar container Redis:" -ForegroundColor Red
        Write-Host $createResult -ForegroundColor Red
        exit 1
    }
}
