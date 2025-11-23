# 🚀 Guia de Deploy - VPS (Porta 3001)

## 📋 Informações da VPS
- **IP**: 72.60.250.20
- **Usuário**: root
- **Senha**: Admingringao1211.
- **Porta da Aplicação**: 3001

---

## 🔧 Passo 1: Conectar na VPS

```bash
ssh root@72.60.250.20
# Senha: Admingringao1211.
```

---

## 📦 Passo 2: Preparar o Ambiente (Se ainda não tiver)

### 2.1 Instalar Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
```

### 2.2 Instalar PM2
```bash
sudo npm install -g pm2
```

### 2.3 Verificar MySQL
```bash
sudo systemctl status mysql
```

---

## 📁 Passo 3: Fazer Upload do Código

### Opção 1: Via Git (Recomendado)
```bash
cd /var/www
git clone https://github.com/seu-usuario/joalheria-analytics.git joalheria-analytics-3001
cd joalheria-analytics-3001
```

### Opção 2: Via SCP (do seu computador local)
```bash
# No seu computador Windows (PowerShell):
scp -r C:\Users\thiag\Documents\gringao\aigringao\joalheria-analytics root@72.60.250.20:/var/www/joalheria-analytics-3001
```

---

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

```bash
cd /var/www/joalheria-analytics-3001

# Criar arquivo .env
cat > .env << 'EOF'
PORT=3001
NODE_ENV=production

JWT_SECRET=joalheria-analytics-secret-key-2025-change-in-production

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=Admingringao1211.
MYSQL_DATABASE_GRINGAO=db_gringao
MYSQL_DATABASE_LOJA=loja_fisica

REDIS_HOST=localhost
REDIS_PORT=6379

OPENROUTER_API_KEY=your-key
GEMINI_API_KEY=your-key
DEEPSEEK_API_KEY=your-key

FRONTEND_URL=http://72.60.250.20:3001
EOF
```

---

## 🏗️ Passo 5: Instalar Dependências e Build

```bash
# Instalar dependências do backend
npm install --production=false

# Instalar dependências do frontend
cd client
npm install
cd ..

# Build do frontend
cd client
npm run build
cd ..

# Build do backend
npm run build:server

# Criar diretório de logs
mkdir -p logs
```

---

## 👤 Passo 6: Criar Usuário Admin

```bash
npx tsx scripts/create-admin.ts
```

**Credenciais criadas:**
- Email: `admin@joalheria.com`
- Senha: `admin123`

---

## 🚀 Passo 7: Iniciar com PM2

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save

# Configurar auto-start
pm2 startup
# Copie e execute o comando que aparecer
```

---

## 🌐 Passo 8: Configurar Nginx (Opcional)

Se quiser usar um domínio ou HTTPS:

```bash
sudo nano /etc/nginx/sites-available/joalheria-analytics-3001
```

Adicione:
```nginx
server {
    listen 80;
    server_name analytics.seudominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar:
```bash
sudo ln -s /etc/nginx/sites-available/joalheria-analytics-3001 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Passo 9: Configurar Firewall

```bash
# Permitir porta 3001
sudo ufw allow 3001/tcp

# Verificar status
sudo ufw status
```

---

## ✅ Passo 10: Testar

Acesse no navegador:
```
http://72.60.250.20:3001
```

Faça login com:
- Email: `admin@joalheria.com`
- Senha: `admin123`

---

## 📊 Comandos Úteis

### Ver logs
```bash
pm2 logs joalheria-analytics-3001
```

### Reiniciar aplicação
```bash
pm2 restart joalheria-analytics-3001
```

### Parar aplicação
```bash
pm2 stop joalheria-analytics-3001
```

### Status
```bash
pm2 status
```

### Monitorar recursos
```bash
pm2 monit
```

---

## 🔄 Atualizar Aplicação

Quando fizer mudanças no código:

```bash
cd /var/www/joalheria-analytics-3001

# Opção 1: Via Git
git pull origin main

# Opção 2: Via SCP (do seu computador)
# scp -r ... (mesmo comando do passo 3)

# Reinstalar dependências e rebuild
npm install
cd client && npm install && npm run build && cd ..
npm run build:server

# Reiniciar
pm2 restart joalheria-analytics-3001
```

Ou use o script automatizado:
```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

---

## 🆘 Troubleshooting

### Porta já em uso
```bash
# Ver o que está usando a porta 3001
sudo lsof -i :3001

# Matar processo se necessário
sudo kill -9 <PID>
```

### Erro de permissão
```bash
# Dar permissão ao diretório
sudo chown -R $USER:$USER /var/www/joalheria-analytics-3001
```

### MySQL não conecta
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Testar conexão
mysql -u root -p
```

---

## 📝 Checklist Final

- [ ] VPS acessível via SSH
- [ ] Node.js 20+ instalado
- [ ] PM2 instalado
- [ ] MySQL rodando
- [ ] Código na VPS
- [ ] `.env` configurado
- [ ] Build concluído
- [ ] Usuário admin criado
- [ ] PM2 rodando
- [ ] Firewall configurado
- [ ] Aplicação acessível em http://72.60.250.20:3001

---

## 🎉 Pronto!

Sua aplicação está rodando em produção na porta 3001!
