# 🚀 Implementação: Redis Cache + Backup para Schemas

## ✅ Implementações Concluídas

### 1. **Redis Cache** ✅
- ✅ Instalado `ioredis` (v5.4.1)
- ✅ Criado módulo `server/redis-cache.ts` com:
  - Inicialização automática do Redis
  - Fallback para SQLite se Redis não estiver disponível
  - Funções: `getCache()`, `setCache()`, `deleteCache()`, `clearSchemaCache()`
  - TTL configurável por schema (2h para db_gringao, 30min para loja_fisica)

### 2. **Sistema de Backup** ✅
- ✅ Criado módulo `server/schema-config.ts` com configuração de schemas
- ✅ Atualizado `external-db.ts` para:
  - Suportar conexão de backup separada
  - Roteamento automático: schemas com backup → backup DB, outros → primary DB
  - Fallback automático: se backup falhar, tenta primary DB
  - Logs indicando se está usando BACKUP ou PRIMARY

### 3. **Integração com Routers** ✅
- ✅ `routers.ts` atualizado para usar Redis cache
- ✅ Dashboard usa Redis primeiro, SQLite como fallback
- ✅ Queries LLM usam Redis primeiro, SQLite como fallback
- ✅ Comparações usam Redis primeiro, SQLite como fallback

### 4. **Configuração de Ambiente** ✅
- ✅ Adicionadas variáveis no `env.example`:
  - `BACKUP_DB_HOST`, `BACKUP_DB_PORT`, `BACKUP_DB_USER`, `BACKUP_DB_PASSWORD`
  - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`

## 📋 Próximos Passos

### 1. **Schemas Configurados** ✅
Os 2 schemas já estão configurados em `server/schema-config.ts`:

- **db_gringao**: E-commerce (usa backup - dados históricos)
- **loja_fisica**: Loja Física (usa principal - dados em tempo real)

### 2. **Instalar Redis**
```bash
# Windows (usando Chocolatey)
choco install redis-64

# Ou baixe de: https://github.com/microsoftarchive/redis/releases

# Linux/Mac
# brew install redis (Mac)
# apt-get install redis (Linux)
```

### 3. **Configurar Variáveis de Ambiente**
Copie `env.example` para `.env` e configure:

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Backup DB (pode ser o mesmo servidor ou diferente)
BACKUP_DB_HOST=5.161.115.232
BACKUP_DB_PORT=3306
BACKUP_DB_USER=app
BACKUP_DB_PASSWORD=sua_senha
```

### 4. **Instalar Dependências**
```bash
npm install
```

## 🎯 Benefícios

### **Performance**
- **Redis**: Cache em memória, resposta < 5ms
- **Backup DB**: Queries em banco dedicado, sem impacto no principal
- **Fallback**: Sistema continua funcionando mesmo se Redis/Backup falhar

### **Escalabilidade**
- Suporta 23 schemas facilmente
- Cada schema pode ter configuração própria de backup
- Cache distribuído (Redis) pode ser compartilhado entre instâncias

### **Confiabilidade**
- Fallback automático para SQLite se Redis falhar
- Fallback automático para primary DB se backup falhar
- Logs detalhados para diagnóstico

## 📊 Arquitetura

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   tRPC Router   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐      ┌──────────┐
│  Redis Cache    │◄─────┤  SQLite  │ (fallback)
│  (Primário)     │      │ (backup) │
└─────────────────┘      └──────────┘
       │
       │ Cache Miss
       ▼
┌─────────────────┐
│  Schema Config  │
│  (23 schemas)   │
└──────┬──────────┘
       │
       ├─► useBackup: true  ──► Backup DB
       │
       └─► useBackup: false ──► Primary DB
```

## 🔧 Como Funciona

1. **Cache Hit (Redis)**: Retorna imediatamente (< 5ms)
2. **Cache Miss**: 
   - Verifica se schema usa backup
   - Executa query no banco apropriado (backup ou primary)
   - Salva resultado no Redis (TTL configurável)
   - Salva também no SQLite (backup persistente)

3. **Fallback**:
   - Se Redis falhar → usa SQLite
   - Se Backup DB falhar → usa Primary DB

## 📝 Notas

- Redis é opcional: se não estiver disponível, usa SQLite
- Backup DB é opcional: se não configurado, usa Primary DB
- TTL pode ser ajustado por schema conforme necessidade
- Logs mostram claramente qual sistema está sendo usado

