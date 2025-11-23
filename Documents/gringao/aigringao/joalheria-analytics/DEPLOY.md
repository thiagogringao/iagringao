# 🚀 Guia de Deploy para VPS

Este guia detalha como fazer o deploy da aplicação **Joalheria Analytics** em uma VPS (Ubuntu/Debian).

---

## 📋 Pré-requisitos na VPS

1. **Sistema Operacional**: Ubuntu 20.04+ ou Debian 11+
2. **Node.js**: v18+ (recomendado v20)
3. **MySQL**: 5.7+ ou 8.0+
4. **Nginx**: Para proxy reverso
5. **PM2**: Para gerenciar processos Node.js
6. **Redis** (Opcional): Para cache distribuído

---

## 🔧 Passo 1: Preparar a VPS

### 1.1 Atualizar o sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Instalar Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Deve mostrar v20.x
```

### 1.3 Instalar PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 1.4 Instalar Nginx
```bash
sudo apt install -y nginx
```

### 1.5 Instalar MySQL (se ainda não tiver)
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### 1.6 Instalar Redis (Opcional, mas recomendado)
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

---

## 📦 Passo 2: Fazer Upload da Aplicação

### 2.1 Clonar ou fazer upload do código
```bash
# Opção 1: Via Git (recomendado)
cd /var/www
sudo git clone https://github.com/seu-usuario/joalheria-analytics.git
cd joalheria-analytics

# Opção 2: Via SCP/SFTP
# Faça upload dos arquivos para /var/www/joalheria-analytics
```

### 2.2 Instalar dependências
```bash
npm install
cd client && npm install && cd ..
```

---

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### 3.1 Criar arquivo `.env`
```bash
cp .env.example .env
nano .env
```

### 3.2 Editar as variáveis (IMPORTANTE!)
```env
# Configurações do Servidor
PORT=3000
NODE_ENV=production

# JWT Secret (GERE UMA CHAVE SEGURA!)
JWT_SECRET=$(openssl rand -base64 32)

# Banco de Dados MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=seu_usuario
MYSQL_PASSWORD=sua_senha_segura
MYSQL_DATABASE_GRINGAO=db_gringao
MYSQL_DATABASE_LOJA=loja_fisica

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# LLM APIs
OPENROUTER_API_KEY=sua-chave-openrouter
GEMINI_API_KEY=sua-chave-gemini
DEEPSEEK_API_KEY=sua-chave-deepseek

# URL do Frontend
FRONTEND_URL=https://seu-dominio.com
```

---

## 🏗️ Passo 4: Build da Aplicação

### 4.1 Build do Frontend
```bash
cd client
npm run build
cd ..
```

### 4.2 Build do Backend (TypeScript)
```bash
npm run build:server
```

---

## 🚀 Passo 5: Configurar PM2

### 5.1 Criar arquivo `ecosystem.config.js`
```bash
nano ecosystem.config.js
```

### 5.2 Adicionar configuração
```javascript
module.exports = {
  apps: [{
    name: 'joalheria-analytics',
    script: 'dist/server/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 5.3 Iniciar a aplicação
```bash
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Seguir instruções para auto-start
```

---

## 🌐 Passo 6: Configurar Nginx

### 6.1 Criar configuração do site
```bash
sudo nano /etc/nginx/sites-available/joalheria-analytics
```

### 6.2 Adicionar configuração
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Frontend (arquivos estáticos)
    location / {
        root /var/www/joalheria-analytics/client/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache de assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API (Proxy para Node.js)
    location /trpc {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Compressão Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

### 6.3 Ativar o site
```bash
sudo ln -s /etc/nginx/sites-available/joalheria-analytics /etc/nginx/sites-enabled/
sudo nginx -t  # Testar configuração
sudo systemctl reload nginx
```

---

## 🔒 Passo 7: Configurar SSL (HTTPS)

### 7.1 Instalar Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Obter certificado SSL
```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 7.3 Renovação automática
```bash
sudo certbot renew --dry-run
```

---

## 🔐 Passo 8: Segurança

### 8.1 Configurar Firewall (UFW)
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 8.2 Proteger MySQL
```bash
# Criar usuário específico para a aplicação
sudo mysql -u root -p

CREATE USER 'joalheria_app'@'localhost' IDENTIFIED BY 'senha_forte_aqui';
GRANT SELECT, INSERT, UPDATE, DELETE ON db_gringao.* TO 'joalheria_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON loja_fisica.* TO 'joalheria_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 8.3 Atualizar `.env` com novo usuário
```env
MYSQL_USER=joalheria_app
MYSQL_PASSWORD=senha_forte_aqui
```

---

## 📊 Passo 9: Monitoramento

### 9.1 Ver logs da aplicação
```bash
pm2 logs joalheria-analytics
```

### 9.2 Monitorar recursos
```bash
pm2 monit
```

### 9.3 Status da aplicação
```bash
pm2 status
```

---

## 🔄 Passo 10: Atualizações

### Script de deploy automático
Crie um arquivo `deploy.sh`:
```bash
#!/bin/bash

echo "🚀 Iniciando deploy..."

# Pull do código
git pull origin main

# Instalar dependências
npm install
cd client && npm install && cd ..

# Build
cd client && npm run build && cd ..
npm run build:server

# Reiniciar aplicação
pm2 restart joalheria-analytics

echo "✅ Deploy concluído!"
```

Tornar executável:
```bash
chmod +x deploy.sh
```

Executar:
```bash
./deploy.sh
```

---

## 🧪 Passo 11: Testar a Aplicação

1. **Acessar via navegador**: `https://seu-dominio.com`
2. **Fazer login** com as credenciais configuradas
3. **Testar funcionalidades**:
   - Fazer uma pergunta
   - Verificar histórico
   - Testar logout

---

## 🆘 Troubleshooting

### Aplicação não inicia
```bash
pm2 logs joalheria-analytics --lines 100
```

### Erro de conexão com MySQL
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Testar conexão
mysql -u joalheria_app -p -h localhost
```

### Erro 502 Bad Gateway (Nginx)
```bash
# Verificar se o backend está rodando
pm2 status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

### Redis não conecta
```bash
# Verificar status
sudo systemctl status redis-server

# Testar conexão
redis-cli ping  # Deve retornar "PONG"
```

---

## 📝 Checklist Final

- [ ] Node.js instalado (v20+)
- [ ] MySQL configurado e rodando
- [ ] Redis instalado (opcional)
- [ ] Código da aplicação na VPS
- [ ] `.env` configurado corretamente
- [ ] Build do frontend e backend concluído
- [ ] PM2 configurado e aplicação rodando
- [ ] Nginx configurado como proxy reverso
- [ ] SSL/HTTPS configurado (Certbot)
- [ ] Firewall configurado (UFW)
- [ ] Aplicação acessível via domínio
- [ ] Login funcionando
- [ ] Funcionalidades testadas

---

## 🎉 Pronto!

Sua aplicação **Joalheria Analytics** está agora rodando em produção na VPS!

**URL de Acesso**: `https://seu-dominio.com`

**Credenciais Padrão**:
- Email: `demo@joalheria.com`
- Senha: Qualquer senha (modo demo)

**Importante**: Lembre-se de alterar as credenciais de demonstração para credenciais reais em produção!

---

## 📞 Suporte

Para dúvidas ou problemas, consulte os logs:
```bash
pm2 logs joalheria-analytics
sudo tail -f /var/log/nginx/error.log
```
