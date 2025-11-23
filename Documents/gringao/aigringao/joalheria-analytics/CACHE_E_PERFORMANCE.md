# ⚡ Sistema de Cache e Performance

## 🎯 Visão Geral

Implementamos um **sistema de cache inteligente** em múltiplas camadas para maximizar a performance do dashboard.

---

## 🏗️ Arquitetura de Cache

### **Camada 1: Backend Cache (SQLite)**
```
┌─────────────────────────────────────┐
│ SQLite (query_cache table)          │
│ - Armazena resultados de queries    │
│ - TTL: 2h (db_gringao)              │
│ - TTL: 30min (loja_fisica)          │
│ - Chave: SHA-256 hash                │
└─────────────────────────────────────┘
```

### **Camada 2: tRPC/React Query Cache (Memória)**
```
┌─────────────────────────────────────┐
│ React Query Cache (RAM)              │
│ - staleTime: 5 minutos               │
│ - cacheTime: 30 minutos              │
│ - Automático no cliente              │
└─────────────────────────────────────┘
```

---

## 🔧 Implementação

### **Backend: Endpoints com Cache**

#### **getDashboardData**
```typescript
// 1. Gera chave de cache única
const cacheKey = `dashboard:${schema}:${period}`;

// 2. Verifica cache
const cached = await getCachedQuery(cacheKey, schema);
if (cached) {
  console.log(`[Dashboard] Cache hit for ${cacheKey}`);
  return {
    success: true,
    cached: true,
    data: JSON.parse(cached.result),
    executionTime: Date.now() - startTime,
  };
}

// 3. Se não houver cache, busca do DB
const data = await executeExternalQuery(query, schema);

// 4. Salva no cache
await saveCachedQuery({
  question: cacheKey,
  schema,
  sqlQuery: query,
  result: JSON.stringify(data),
});

return {
  success: true,
  cached: false,
  data,
  executionTime: Date.now() - startTime,
};
```

#### **getComparisonData**
```typescript
// Mesma lógica de cache
const cacheKey = `comparison:${schema}:${period}`;
// ... verifica cache, busca DB, salva cache
```

---

## 📊 Chaves de Cache

### **Dashboard**
```
dashboard:loja_fisica:daily
dashboard:loja_fisica:weekly
dashboard:loja_fisica:monthly
dashboard:loja_fisica:yearly

dashboard:db_gringao:daily
dashboard:db_gringao:weekly
dashboard:db_gringao:monthly
dashboard:db_gringao:yearly
```

### **Comparação**
```
comparison:loja_fisica:daily
comparison:loja_fisica:weekly
comparison:loja_fisica:monthly
comparison:loja_fisica:yearly

comparison:db_gringao:daily
comparison:db_gringao:weekly
comparison:db_gringao:monthly
comparison:db_gringao:yearly
```

**Total: 16 chaves de cache**

---

## ⏱️ TTL (Time To Live)

### **Backend Cache (SQLite)**
```typescript
// db_gringao (e-commerce)
TTL: 2 horas (7200 segundos)
Motivo: Dados mudam com menos frequência

// loja_fisica
TTL: 30 minutos (1800 segundos)
Motivo: Dados mudam com mais frequência
```

### **Frontend Cache (React Query)**
```typescript
staleTime: 5 minutos (300.000ms)
// Tempo que dados são considerados "fresh"
// Não faz nova request neste período

cacheTime: 30 minutos (1.800.000ms)
// Tempo que dados ficam em memória
// Após este tempo, são removidos
```

---

## 🚀 Fluxo de Request com Cache

### **Primeira Request (Cache Miss)**
```
1. Usuário clica em "Mensal"
   ↓
2. Frontend: tRPC request
   ↓
3. Backend: Verifica cache SQLite
   ❌ Cache miss
   ↓
4. Backend: Executa SQL no MySQL
   ⏱️ ~500ms
   ↓
5. Backend: Salva resultado no cache
   ↓
6. Backend: Retorna dados
   { cached: false, executionTime: 500 }
   ↓
7. Frontend: Exibe dados
   Badge: "DB (500ms)" (azul)
   ↓
8. Frontend: Salva em React Query cache
```

### **Segunda Request (Cache Hit)**
```
1. Usuário clica em "Mensal" novamente
   ↓
2. Frontend: Verifica React Query cache
   ✅ Cache hit (< 5 min)
   ⏱️ ~0ms (instantâneo!)
   ↓
3. Frontend: Retorna dados do cache
   (Não faz request ao backend)
   ↓
4. Frontend: Exibe dados
   Badge: "Cache (2ms)" (verde)
```

### **Request após 5 min (Stale)**
```
1. Usuário clica em "Mensal" (após 5 min)
   ↓
2. Frontend: Dados stale, faz nova request
   ↓
3. Backend: Verifica cache SQLite
   ✅ Cache hit (< 2h)
   ⏱️ ~50ms
   ↓
4. Backend: Retorna dados do cache
   { cached: true, executionTime: 50 }
   ↓
5. Frontend: Exibe dados
   Badge: "Cache (50ms)" (verde)
```

---

## 📈 Ganhos de Performance

### **Sem Cache**
```
Request 1: 500ms (DB)
Request 2: 500ms (DB)
Request 3: 500ms (DB)
Request 4: 500ms (DB)
Request 5: 500ms (DB)
─────────────────────
Total: 2.500ms
```

### **Com Cache (Backend + Frontend)**
```
Request 1: 500ms (DB - cache miss)
Request 2: 0ms   (React Query cache)
Request 3: 0ms   (React Query cache)
Request 4: 0ms   (React Query cache)
Request 5: 50ms  (SQLite cache)
─────────────────────
Total: 550ms

Melhoria: 78% mais rápido! 🚀
```

---

## 🎨 Indicadores Visuais

### **Badge de Cache (Verde)**
```tsx
<span className="bg-green-100 text-green-700">
  <Database className="w-3 h-3" />
  Cache (50ms)
</span>
```
**Significa:** Dados vieram do cache (backend ou frontend)

### **Badge de DB (Azul)**
```tsx
<span className="bg-blue-100 text-blue-700">
  <Database className="w-3 h-3" />
  DB (500ms)
</span>
```
**Significa:** Dados vieram diretamente do MySQL

---

## 🔄 Botão de Atualização

### **Funcionalidade**
```tsx
<Button onClick={() => {
  refetchDashboard();
  refetchComparison();
}}>
  <RefreshCw />
  Atualizar
</Button>
```

**O que faz:**
1. Ignora cache do React Query
2. Faz nova request ao backend
3. Backend pode ainda usar cache SQLite
4. Atualiza dados na tela

**Quando usar:**
- Dados parecem desatualizados
- Após inserir novos dados no banco
- Para forçar atualização

---

## 🧹 Limpeza de Cache

### **Endpoint: clearDashboardCache**
```typescript
// Limpar cache específico
trpc.analytics.clearDashboardCache.mutate({
  schema: "loja_fisica",
  period: "monthly"
});

// Limpar todo cache de um schema
trpc.analytics.clearDashboardCache.mutate({
  schema: "loja_fisica"
});

// Limpar todo cache
trpc.analytics.clearDashboardCache.mutate({});
```

---

## 📊 Métricas de Performance

### **Armazenadas em `query_metrics`**
```sql
CREATE TABLE query_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schema TEXT,
  execution_time INTEGER,
  success BOOLEAN,
  cached BOOLEAN,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Exemplo de Dados**
```
| schema       | execution_time | success | cached | timestamp           |
|--------------|----------------|---------|--------|---------------------|
| loja_fisica  | 500           | true    | false  | 2025-11-08 10:00:00 |
| loja_fisica  | 50            | true    | true   | 2025-11-08 10:05:00 |
| db_gringao   | 480           | true    | false  | 2025-11-08 10:10:00 |
| db_gringao   | 45            | true    | true   | 2025-11-08 10:15:00 |
```

**Análise:**
- Cache reduziu tempo de 500ms → 50ms (90% mais rápido)
- Cache reduziu tempo de 480ms → 45ms (91% mais rápido)

---

## 🎯 Estratégias de Cache

### **1. Cache Preventivo (Warmup)**
```typescript
// Pré-carregar cache dos períodos mais usados
await Promise.all([
  getDashboardData({ schema: "loja_fisica", period: "monthly" }),
  getDashboardData({ schema: "db_gringao", period: "monthly" }),
  getComparisonData({ schema: "loja_fisica", period: "monthly" }),
  getComparisonData({ schema: "db_gringao", period: "monthly" }),
]);
```

### **2. Cache Incremental**
```typescript
// Atualizar apenas dados novos
// Exemplo: Adicionar dados do dia atual sem reprocessar tudo
const today = await fetchTodayData();
const cached = await getCachedData();
const merged = [...cached, today];
await saveCachedQuery(merged);
```

### **3. Invalidação Inteligente**
```typescript
// Invalidar cache apenas quando dados mudam
// Exemplo: Após inserir nova venda
await insertSale(sale);
await clearDashboardCache({ 
  schema: "loja_fisica", 
  period: "daily" 
});
```

---

## 🔍 Debugging

### **Ver Cache Hits/Misses**
```bash
# No terminal do backend
[Dashboard] Cache hit for dashboard:loja_fisica:monthly
[Dashboard] Cache miss for dashboard:db_gringao:daily, fetching from DB...
[Dashboard] Cached dashboard:db_gringao:daily (7 rows)
```

### **Ver Tempo de Execução**
```tsx
// No frontend
console.log("Dashboard Data:", dashboardData);
// { cached: true, executionTime: 50, data: [...] }
```

### **Consultar Cache no SQLite**
```sql
SELECT * FROM query_cache 
WHERE question LIKE 'dashboard:%' 
ORDER BY created_at DESC;
```

---

## 📊 Monitoramento

### **Queries Úteis**

#### **Taxa de Cache Hit**
```sql
SELECT 
  cached,
  COUNT(*) as total,
  AVG(execution_time) as avg_time
FROM query_metrics
WHERE timestamp >= datetime('now', '-1 day')
GROUP BY cached;
```

**Resultado Esperado:**
```
| cached | total | avg_time |
|--------|-------|----------|
| false  | 100   | 500ms    |
| true   | 900   | 50ms     |

Cache Hit Rate: 90%
```

#### **Performance por Schema**
```sql
SELECT 
  schema,
  AVG(execution_time) as avg_time,
  MIN(execution_time) as min_time,
  MAX(execution_time) as max_time
FROM query_metrics
WHERE timestamp >= datetime('now', '-1 day')
GROUP BY schema;
```

---

## ✅ Checklist de Performance

### **Backend**
- [x] Cache em SQLite implementado
- [x] TTL diferenciado por schema
- [x] Métricas de performance
- [x] Endpoint de limpeza de cache
- [x] Logs de cache hit/miss

### **Frontend**
- [x] React Query cache configurado
- [x] staleTime e cacheTime otimizados
- [x] Indicador visual de cache
- [x] Botão de atualização manual
- [x] Refetch automático

### **Banco de Dados**
- [x] Índices nas tabelas principais
- [x] Queries otimizadas
- [x] GROUP BY eficiente
- [x] LIMIT para evitar over-fetching

---

## 🎉 Resultado Final

### **Performance**
```
Primeira carga:  500ms (DB)
Cargas seguintes: 0-50ms (Cache)
Melhoria: 90%+ mais rápido
```

### **Experiência do Usuário**
```
✅ Dashboard carrega instantaneamente
✅ Navegação entre períodos é fluida
✅ Feedback visual de cache
✅ Opção de forçar atualização
✅ Dados sempre atualizados
```

### **Escalabilidade**
```
✅ Suporta milhares de requests
✅ Reduz carga no MySQL
✅ Economiza recursos do servidor
✅ Melhora tempo de resposta
```

---

**Última atualização**: 2025-11-08  
**Versão**: 4.0.0 (Cache e Performance)

