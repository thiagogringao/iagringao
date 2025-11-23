# 💎 Joalheria Analytics

Sistema de análise inteligente de dados para joalherias, utilizando IA para gerar insights a partir de perguntas em linguagem natural.

![Status](https://img.shields.io/badge/status-production-green)
![Node](https://img.shields.io/badge/node-v20+-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🚀 Funcionalidades

- 🤖 **Análise com IA**: Faça perguntas em linguagem natural e receba respostas inteligentes
- 📊 **Múltiplas Fontes**: Analise dados de E-commerce e Loja Física
- 📈 **Visualizações**: Gráficos automáticos baseados nos dados
- 🔒 **Autenticação**: Sistema de login seguro com JWT
- ⚡ **Performance**: Cache em múltiplas camadas (Redis + Memória + SQLite)
- 📝 **Histórico**: Acompanhe suas conversas anteriores
- 🎨 **Interface Moderna**: Design responsivo e intuitivo

---

## 🛠️ Tecnologias

### Backend
- **Node.js** + TypeScript
- **tRPC** - APIs type-safe
- **Express** - Servidor HTTP
- **MySQL** - Banco de dados principal
- **SQLite** - Cache local
- **Redis** - Cache distribuído (opcional)
- **JWT** - Autenticação

### Frontend
- **React 19** + Vite
- **Tailwind CSS 4**
- **shadcn/ui** - Componentes
- **Recharts** - Gráficos
- **React Query** - Gerenciamento de estado

### IA
- **OpenRouter** (Claude Sonnet 3.5)
- **Google Gemini Flash**
- **DeepSeek R1**

---

## 📦 Instalação Local

### Pré-requisitos
- Node.js 20+
- MySQL 5.7+ ou 8.0+
- Redis (opcional, mas recomendado)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/joalheria-analytics.git
cd joalheria-analytics
```

2. **Instale as dependências**
```bash
npm install
cd client && npm install && cd ..
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

5. **Acesse a aplicação**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

---

## 🔐 Autenticação

### Credenciais de Demonstração
- **Email**: `demo@joalheria.com`
- **Senha**: Qualquer senha (modo demo)

### Configurar Usuários em Produção
Em produção, você deve criar usuários reais no banco de dados. Consulte o arquivo `DEPLOY.md` para instruções detalhadas.

---

## 🚀 Deploy para Produção

Consulte o guia completo de deploy em **[DEPLOY.md](./DEPLOY.md)**.

### Resumo Rápido

1. **Preparar VPS** (Ubuntu/Debian)
2. **Instalar dependências** (Node.js, MySQL, Nginx, PM2)
3. **Configurar variáveis de ambiente**
4. **Fazer build da aplicação**
```bash
npm run build
```
5. **Iniciar com PM2**
```bash
pm2 start ecosystem.config.js
```
6. **Configurar Nginx** como proxy reverso
7. **Configurar SSL** com Certbot

### Script de Deploy Automático
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📊 Estrutura do Projeto

```
joalheria-analytics/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas (Home, Login)
│   │   └── lib/           # Utilitários
│   └── package.json
├── server/                 # Backend Node.js
│   ├── index.ts           # Servidor principal
│   ├── routers.ts         # Rotas tRPC
│   ├── auth.ts            # Autenticação JWT
│   ├── llm-*.ts           # Integração com LLMs
│   └── db.ts              # Banco de dados
├── drizzle/               # Schema do banco
├── scripts/               # Scripts utilitários
├── .env.example           # Exemplo de variáveis
├── ecosystem.config.js    # Configuração PM2
├── deploy.sh              # Script de deploy
├── DEPLOY.md              # Guia de deploy
└── package.json
```

---

## 🔧 Scripts Disponíveis

### Desenvolvimento
```bash
npm run dev              # Inicia dev server (frontend + backend)
npm run dev:server       # Apenas backend
npm run dev:client       # Apenas frontend
```

### Build
```bash
npm run build            # Build completo (frontend + backend)
npm run build:client     # Build do frontend
npm run build:server     # Build do backend
```

### Produção
```bash
npm start                # Inicia servidor em produção
npm run pm2:start        # Inicia com PM2
npm run pm2:restart      # Reinicia aplicação
npm run pm2:logs         # Ver logs
```

### Banco de Dados
```bash
npm run db:push          # Atualiza schema do banco
npm run db:studio        # Abre Drizzle Studio
```

---

## 🌐 Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
# Servidor
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=sua-chave-secreta-aqui

# MySQL
MYSQL_HOST=localhost
MYSQL_USER=seu_usuario
MYSQL_PASSWORD=sua_senha
MYSQL_DATABASE_GRINGAO=db_gringao
MYSQL_DATABASE_LOJA=loja_fisica

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379

# LLM APIs
OPENROUTER_API_KEY=sua-chave
GEMINI_API_KEY=sua-chave
DEEPSEEK_API_KEY=sua-chave
```

---

## 📝 Uso

1. **Faça login** com suas credenciais
2. **Selecione a fonte de dados** (E-commerce ou Loja Física)
3. **Escolha o modelo de IA** (Claude, Gemini ou DeepSeek)
4. **Faça perguntas** em linguagem natural:
   - "Qual o faturamento de hoje?"
   - "Produtos mais vendidos este mês"
   - "Compare as vendas de outubro com novembro"
5. **Visualize os resultados** em gráficos e tabelas
6. **Consulte o histórico** de conversas anteriores

---

## 🔒 Segurança

- ✅ Autenticação JWT
- ✅ Senhas hasheadas com bcrypt
- ✅ Variáveis de ambiente para dados sensíveis
- ✅ HTTPS em produção (via Certbot)
- ✅ Firewall configurado (UFW)
- ✅ Usuário MySQL com permissões limitadas

---

## 📈 Performance

- ⚡ Cache em 3 camadas (Redis → Memória → SQLite)
- ⚡ Compressão Gzip
- ⚡ Client-side caching (React Query)
- ⚡ Índices otimizados no MySQL
- ⚡ Cluster mode com PM2

---

## 🆘 Troubleshooting

### Erro de conexão com MySQL
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Testar conexão
mysql -u seu_usuario -p
```

### Aplicação não inicia
```bash
# Ver logs
pm2 logs joalheria-analytics

# Verificar status
pm2 status
```

### Redis não conecta
```bash
# Verificar status
sudo systemctl status redis-server

# Testar
redis-cli ping
```

---

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👥 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📞 Suporte

Para dúvidas ou problemas:
- 📧 Email: suporte@joalheria.com
- 📝 Issues: [GitHub Issues](https://github.com/seu-usuario/joalheria-analytics/issues)

---

**Desenvolvido com ❤️ para joalherias**
