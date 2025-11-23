# 🚀 Guia de Instalação do Redis no Windows

O Redis **NÃO está instalado** no seu sistema. Para melhorar significativamente a performance da aplicação, você precisa instalar o Redis.

## 📋 Opções de Instalação

### Opção 1: Docker (Recomendado - Mais Fácil) ⭐

1. **Instale o Docker Desktop** (se ainda não tiver):
   - Baixe em: https://www.docker.com/products/docker-desktop/
   - Instale e inicie o Docker Desktop

2. **Execute o Redis em um container**:
   ```powershell
   docker run -d --name redis-cache -p 6379:6379 redis:alpine
   ```

3. **Verifique se está rodando**:
   ```powershell
   docker ps
   ```
   Você deve ver um container chamado `redis-cache` rodando.

4. **Teste a conexão**:
   ```powershell
   docker exec -it redis-cache redis-cli ping
   ```
   Deve retornar: `PONG`

### Opção 2: WSL2 (Windows Subsystem for Linux)

1. **Instale o WSL2** (se ainda não tiver):
   ```powershell
   wsl --install
   ```
   Reinicie o computador após a instalação.

2. **No terminal WSL (Ubuntu), instale o Redis**:
   ```bash
   sudo apt update
   sudo apt install redis-server -y
   sudo service redis-server start
   ```

3. **Configure o Redis para aceitar conexões externas**:
   Edite `/etc/redis/redis.conf` e altere:
   ```
   bind 127.0.0.1
   ```
   Para:
   ```
   bind 0.0.0.0
   ```

4. **Reinicie o Redis**:
   ```bash
   sudo service redis-server restart
   ```

### Opção 3: Memurai (Redis para Windows Nativo)

1. **Baixe o Memurai**:
   - https://www.memurai.com/get-memurai
   - É uma versão comercial do Redis para Windows

2. **Instale e inicie o serviço**

3. **O Memurai roda na porta 6379 por padrão**

### Opção 4: Redis via Chocolatey

1. **Instale o Chocolatey** (se ainda não tiver):
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. **Instale o Redis**:
   ```powershell
   choco install redis-64 -y
   ```

3. **Inicie o Redis**:
   ```powershell
   redis-server
   ```

## ✅ Verificação

Após instalar, verifique se o Redis está funcionando:

1. **Teste a conexão**:
   ```powershell
   # Se instalou via Docker:
   docker exec -it redis-cache redis-cli ping
   
   # Se instalou via WSL:
   wsl redis-cli ping
   
   # Se instalou via Chocolatey ou Memurai:
   redis-cli ping
   ```

2. **Reinicie o servidor da aplicação**:
   ```powershell
   cd joalheria-analytics
   npm run dev:server
   ```

3. **Procure por esta mensagem nos logs**:
   ```
   [Redis] ✅ Connected and tested successfully at localhost:6379
   ```

## 🔧 Configuração no .env

Certifique-se de que o arquivo `.env` tem as configurações corretas:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## ⚠️ Importante

- **Sem Redis**: A aplicação funcionará, mas será **muito mais lenta** usando apenas SQLite como cache
- **Com Redis**: A aplicação será **muito mais rápida**, especialmente para:
  - Dashboard com queries complexas
  - Lista de produtos (milhares de itens)
  - Comparações entre períodos

## 🆘 Problemas Comuns

### Redis não conecta
- Verifique se o serviço está rodando
- Verifique se a porta 6379 está livre: `netstat -an | findstr 6379`
- Verifique o firewall do Windows

### Docker não funciona
- Certifique-se de que o Docker Desktop está rodando
- Verifique se a virtualização está habilitada no BIOS

### WSL não funciona
- Execute `wsl --update` para atualizar o WSL
- Verifique se o WSL2 está instalado: `wsl --status`
