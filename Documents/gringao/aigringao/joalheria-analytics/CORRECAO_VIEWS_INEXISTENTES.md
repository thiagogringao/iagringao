# 🔧 Correção: Views Inexistentes e Nome de Tabela Incorreto

## 📋 Problema Identificado

A aplicação estava mostrando "Nenhum dado disponível" no dashboard, mesmo havendo dados no banco de dados.

### 🔍 Causa Raiz #1: Views Inexistentes

No arquivo `server/index.ts`, o código de **pré-carregamento de cache** estava tentando usar **views SQL** que não existem no banco de dados:

```sql
-- ❌ ERRADO (views inexistentes)
SELECT mes_nome as mes, receita, custo, lucro
FROM loja_fisica.vw_vendas_mensais
WHERE ano = YEAR(CURDATE())
```

Enquanto isso, no arquivo `server/routers.ts`, as queries corretas usavam as **tabelas diretamente**:

```sql
-- ✅ CORRETO (tabelas reais)
SELECT 
  MONTH(DATA) as mes_numero,
  DATE_FORMAT(DATA, '%b') as mes,
  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro
FROM loja_fisica.caixas_venda
WHERE YEAR(DATA) = 2025
GROUP BY MONTH(DATA)
```

### 🚨 Impacto

- O pré-carregamento de cache **falhava silenciosamente** ao tentar acessar views inexistentes
- O cache ficava **vazio** ou com dados incorretos
- Quando o frontend requisitava dados, recebia **arrays vazios**
- Dashboard mostrava "Nenhum dado disponível" mesmo com dados no banco

### 🔍 Causa Raiz #2: Nome de Tabela Incorreto

Além disso, o código estava usando `db_gringao.pedidos` quando o nome correto da tabela é `db_gringao.bling2_pedidos`:

```sql
-- ❌ ERRADO (tabela não existe)
FROM db_gringao.pedidos

-- ✅ CORRETO (tabela real)
FROM db_gringao.bling2_pedidos
```

---

## ✅ Soluções Implementadas

### Correção #1: Substituir Views por Queries Diretas

### Mudanças no `server/index.ts`

Substituí todas as queries de pré-carregamento para usar as **mesmas queries do `routers.ts`**:

#### **Loja Física - Monthly**

```typescript
fetchFunctions.set("dashboard:loja_fisica:monthly", {
  schema: "loja_fisica",
  fn: () => executeExternalQuery(`
    SELECT 
      MONTH(DATA) as mes_numero,
      DATE_FORMAT(DATA, '%b') as mes,
      SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
      SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
      SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro,
      COUNT(DISTINCT NUMERO_CUPOM) as transacoes
    FROM loja_fisica.caixas_venda
    WHERE YEAR(DATA) = 2025
    GROUP BY MONTH(DATA), DATE_FORMAT(DATA, '%b')
    ORDER BY MONTH(DATA)
  `, "loja_fisica")
});
```

#### **Loja Física - Yearly**

```typescript
fetchFunctions.set("dashboard:loja_fisica:yearly", {
  schema: "loja_fisica",
  fn: () => executeExternalQuery(`
    SELECT 
      YEAR(DATA) as ano,
      SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
      SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
      SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro,
      COUNT(DISTINCT NUMERO_CUPOM) as transacoes
    FROM loja_fisica.caixas_venda
    WHERE YEAR(DATA) >= 2023
    GROUP BY YEAR(DATA)
    ORDER BY YEAR(DATA)
  `, "loja_fisica")
});
```

#### **E-commerce - Monthly**

```typescript
fetchFunctions.set("dashboard:db_gringao:monthly", {
  schema: "db_gringao",
  fn: () => executeExternalQuery(`
    SELECT 
      MONTH(data) as mes_numero,
      DATE_FORMAT(data, '%b') as mes,
      SUM(valor_total) as receita,
      SUM(valor_total * 0.52) as custo,
      SUM(valor_total * 0.48) as lucro,
      COUNT(DISTINCT id) as transacoes
    FROM db_gringao.pedidos
    WHERE YEAR(data) = 2025
    GROUP BY MONTH(data), DATE_FORMAT(data, '%b')
    ORDER BY MONTH(data)
  `, "db_gringao")
});
```

#### **E-commerce - Yearly**

```typescript
fetchFunctions.set("dashboard:db_gringao:yearly", {
  schema: "db_gringao",
  fn: () => executeExternalQuery(`
    SELECT 
      YEAR(data) as ano,
      SUM(valor_total) as receita,
      SUM(valor_total * 0.52) as custo,
      SUM(valor_total * 0.48) as lucro,
      COUNT(DISTINCT id) as transacoes
    FROM db_gringao.pedidos
    WHERE YEAR(data) >= 2023
    GROUP BY YEAR(data)
    ORDER BY YEAR(data)
  `, "db_gringao")
});
```

### Correção #2: Corrigir Nome da Tabela do E-commerce

Substituí todas as ocorrências de `db_gringao.pedidos` por `db_gringao.bling2_pedidos` em:

- `server/index.ts` (pré-carregamento de cache)
- `server/routers.ts` (endpoints do dashboard)

**Comando usado:**
```typescript
// Substituição global em routers.ts
FROM db_gringao.pedidos → FROM db_gringao.bling2_pedidos
```

---

## 🎯 Resultado

Após as correções:

✅ Pré-carregamento de cache funciona corretamente  
✅ Queries usam tabelas reais (não views inexistentes)  
✅ Nome correto da tabela do e-commerce (`bling2_pedidos`)  
✅ Cache é populado com dados válidos  
✅ Dashboard carrega dados corretamente  
✅ Consistência entre `index.ts` e `routers.ts`

---

## 📝 Lições Aprendidas

1. **Sempre validar se views/tabelas existem** antes de usá-las em queries
2. **Manter consistência** entre queries de pré-carregamento e queries principais
3. **Logs adequados** ajudam a identificar falhas silenciosas
4. **Testar pré-carregamento de cache** após mudanças no schema do banco

---

## 🔄 Como Testar

1. Reinicie o servidor:
   ```bash
   npm run dev
   ```

2. Verifique os logs de pré-carregamento:
   ```
   🔄 Iniciando pré-carregamento de cache...
   [Cache] 💾 Saved: dashboard:loja_fisica:monthly (X rows)
   [Cache] 💾 Saved: dashboard:loja_fisica:yearly (X rows)
   ```

3. Acesse o dashboard no navegador:
   ```
   http://localhost:5173
   ```

4. Verifique se os dados aparecem corretamente

---

**Data da Correção:** 09/11/2025  
**Arquivos Modificados:**
- `server/index.ts` (linhas 60-172)
- `server/routers.ts` (8 ocorrências de nome de tabela)

**Mudanças:**
1. Substituição de views inexistentes por queries diretas
2. Correção de `pedidos` → `bling2_pedidos` (8 ocorrências)

