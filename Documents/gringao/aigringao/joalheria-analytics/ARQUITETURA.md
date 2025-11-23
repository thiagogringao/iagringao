# 🏗️ Arquitetura - Joalheria Analytics

## 📊 Visão Geral

Plataforma conversacional de análise de dados para joalheria, utilizando LLMs para gerar SQL e insights.

## 🗄️ Bancos de Dados

### 1. **db_gringao** (E-commerce - Backup Incremental)
- **Fonte**: Bling API (backup consolidado)
- **Propósito**: Análise histórica de vendas online
- **Tabelas Principais**:
  - `bling2_pedidos` (175 pedidos)
  - `bling2_detalhes_pedidos` (5,308 itens)
  - `bling2_produtos` (5,945 produtos)
  - `bling_contatos` (11,654 clientes)
- **Cache TTL**: 2 horas (dados consolidados)

### 2. **loja_fisica** (PDV - Tempo Real)
- **Fonte**: Sistema PDV físico
- **Propósito**: Análise de vendas em tempo real
- **Tabelas Principais**:
  - `caixas_venda` (2,398,331 vendas!)
  - `produtos` (2,762 produtos)
  - `clientes` (5,176 clientes)
  - `estoque` (4,242 registros)
- **Cache TTL**: 30 minutos (dados em tempo real)

### 3. **joalheria_analytics.db** (SQLite - Interno)
- **Propósito**: Cache, histórico, métricas
- **Tabelas**:
  - `chat_history`: Histórico de conversas
  - `query_cache`: Cache de queries (SHA-256 hash)
  - `query_metrics`: Métricas de performance
  - `users`: Usuários do sistema

## 🚀 Fluxo de Execução

```
1. Usuário faz pergunta
   ↓
2. LLM interpreta e identifica schema (db_gringao ou loja_fisica)
   ↓
3. Sistema verifica CACHE (hash da pergunta + schema)
   ├─ ✅ Cache HIT → Retorna dados cacheados
   └─ ❌ Cache MISS → Continua
   ↓
4. LLM gera SQL válido (MySQL 5.7)
   ↓
5. Sistema valida e corrige SQL
   ↓
6. Executa query no MySQL externo
   ↓
7. LLM gera resposta em linguagem natural
   ↓
8. Salva resultado no CACHE
   ↓
9. Salva histórico e métricas
   ↓
10. Retorna resposta + visualização
```

## 🎯 Sistema de Cache Inteligente

### Estratégia de Cache por Schema

```typescript
// db_gringao (backup incremental) → 2 horas
const cacheDuration = schema === 'db_gringao' ? 7200000 : 1800000;

// loja_fisica (tempo real) → 30 minutos
```

### Hash da Query
```typescript
const hash = crypto.createHash("sha256")
  .update(`${question}:${schema}`)
  .digest("hex");
```

### Benefícios
- ⚡ **Performance**: Evita consultas repetidas
- 💰 **Economia**: Reduz chamadas à LLM
- 🎯 **Precisão**: Resultados consistentes
- 📊 **Métricas**: Rastreamento de uso

## 🤖 Integração LLM

### Providers Suportados
1. **OpenRouter** (Claude Sonnet 3.5) - Padrão
2. **Gemini Flash** - Alternativa

### Prompt Engineering
- Dicionário completo de dados incluído
- Exemplos de SQL corretos
- Regras MySQL 5.7 específicas
- Case-sensitivity enforced
- Validação de colunas existentes

### Parâmetros
```typescript
{
  temperature: 0.3,  // Mais determinístico
  maxTokens: 2000    // Respostas completas
}
```

## 📈 Tipos de Visualização

### Auto-detectados pela LLM

1. **Card (KPI)**
   - Valores únicos (faturamento total, média)
   - Contagens simples

2. **Table**
   - Múltiplos registros
   - Comparações detalhadas

3. **Chart**
   - `line`: Séries temporais
   - `bar`: Comparações
   - `pie`: Distribuições

## 🔒 Segurança

### Validação SQL
- Whitelist de tabelas
- Case-sensitivity enforced
- Proteção contra SQL injection
- Validação de sintaxe MySQL

### Autenticação
- Mock user (dev mode)
- Preparado para Manus OAuth

## 📊 Métricas Coletadas

```typescript
{
  schema: "db_gringao" | "loja_fisica",
  executionTime: number,  // ms
  success: boolean,
  cached: boolean
}
```

## 🎨 Stack Tecnológica

### Backend
- **Node.js** + TypeScript
- **tRPC** - Type-safe APIs
- **Drizzle ORM** - Type-safe queries
- **MySQL** (external) - Dados de produção
- **SQLite** (internal) - Cache local

### Frontend
- **React 19** + Vite
- **Tailwind CSS 4**
- **shadcn/ui** - Components
- **Recharts** - Visualizações

### LLMs
- **OpenRouter** (Claude Sonnet 3.5)
- **Google Gemini Flash**

## 📝 Exemplos de Queries

### E-commerce (db_gringao)
```sql
-- Melhor cliente
SELECT c.nome, SUM(p.total) AS valor_total 
FROM db_gringao.bling_contatos c 
INNER JOIN db_gringao.bling2_pedidos p ON c.id = p.contato_id 
GROUP BY c.id, c.nome 
ORDER BY valor_total DESC 
LIMIT 1
```

### Loja Física (loja_fisica)
```sql
-- Faturamento hoje
SELECT SUM(VALOR_SUBT - VALOR_DESCONTO) AS faturamento 
FROM loja_fisica.caixas_venda 
WHERE DATE(DATA) = CURDATE()
```

## 🔄 Backup Incremental

O schema `db_gringao` recebe atualizações incrementais da API do Bling:
- Novos pedidos
- Atualizações de estoque
- Novos produtos
- Novos clientes

Isso permite análises históricas confiáveis com dados consolidados.

## 🚀 Performance

### Otimizações
1. **Cache inteligente** por schema
2. **Hash SHA-256** para lookups rápidos
3. **Expiração automática** de cache
4. **Índices** no SQLite interno
5. **Conexão persistente** ao MySQL
6. **LLM com baixa temperature** (0.3)

### Métricas Esperadas
- Cache HIT: < 50ms
- Cache MISS: 2-5s (LLM + MySQL)
- SQL Generation: 1-3s
- Natural Language: 1-2s

---

**Última atualização**: 2025-11-07
**Versão**: 1.0.0

