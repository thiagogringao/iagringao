# 🎯 Dashboard com Dados Reais do Banco de Dados

## ✅ Mudança Implementada

**ANTES:** Dashboard usava dados mockados (estáticos)  
**AGORA:** Dashboard busca dados reais do banco de dados via tRPC

---

## 🔧 Arquitetura

### **Backend (Server)**

#### **Arquivo:** `server/routers.ts`

**Novos Endpoints:**

1. **`getDashboardData`** - Busca dados do dashboard
```typescript
trpc.analytics.getDashboardData.useQuery({
  schema: "db_gringao" | "loja_fisica",
  period: "daily" | "weekly" | "monthly" | "yearly"
})
```

2. **`getComparisonData`** - Busca dados de comparação
```typescript
trpc.analytics.getComparisonData.useQuery({
  schema: "db_gringao" | "loja_fisica",
  period: "daily" | "weekly" | "monthly" | "yearly"
})
```

---

## 📊 Queries SQL por Período

### **🏪 Loja Física** (`loja_fisica`)

#### **Diário (Últimos 7 dias)**
```sql
SELECT 
  DAY(DATA) as dia,
  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro
FROM loja_fisica.caixas_venda
WHERE DATA >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DAY(DATA)
ORDER BY DATA DESC
LIMIT 7
```

#### **Semanal (Últimas 4 semanas)**
```sql
SELECT 
  CONCAT('Sem ', WEEK(DATA)) as semana,
  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro
FROM loja_fisica.caixas_venda
WHERE DATA >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
GROUP BY WEEK(DATA)
ORDER BY WEEK(DATA) DESC
LIMIT 4
```

#### **Mensal (Ano atual)**
```sql
SELECT 
  DATE_FORMAT(DATA, '%b') as mes,
  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro
FROM loja_fisica.caixas_venda
WHERE YEAR(DATA) = YEAR(CURDATE())
GROUP BY MONTH(DATA), DATE_FORMAT(DATA, '%b')
ORDER BY MONTH(DATA)
```

#### **Anual (Últimos 3 anos)**
```sql
SELECT 
  YEAR(DATA) as ano,
  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro
FROM loja_fisica.caixas_venda
WHERE YEAR(DATA) >= YEAR(CURDATE()) - 2
GROUP BY YEAR(DATA)
ORDER BY YEAR(DATA)
```

---

### **🛒 E-commerce** (`db_gringao`)

#### **Diário (Últimos 7 dias)**
```sql
SELECT 
  DAY(data) as dia,
  SUM(valor_total) as receita,
  SUM(valor_total * 0.52) as custo,
  SUM(valor_total * 0.48) as lucro
FROM db_gringao.pedidos
WHERE data >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DAY(data)
ORDER BY data DESC
LIMIT 7
```

#### **Semanal (Últimas 4 semanas)**
```sql
SELECT 
  CONCAT('Sem ', WEEK(data)) as semana,
  SUM(valor_total) as receita,
  SUM(valor_total * 0.52) as custo,
  SUM(valor_total * 0.48) as lucro
FROM db_gringao.pedidos
WHERE data >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
GROUP BY WEEK(data)
ORDER BY WEEK(data) DESC
LIMIT 4
```

#### **Mensal (Ano atual)**
```sql
SELECT 
  DATE_FORMAT(data, '%b') as mes,
  SUM(valor_total) as receita,
  SUM(valor_total * 0.52) as custo,
  SUM(valor_total * 0.48) as lucro
FROM db_gringao.pedidos
WHERE YEAR(data) = YEAR(CURDATE())
GROUP BY MONTH(data), DATE_FORMAT(data, '%b')
ORDER BY MONTH(data)
```

#### **Anual (Últimos 3 anos)**
```sql
SELECT 
  YEAR(data) as ano,
  SUM(valor_total) as receita,
  SUM(valor_total * 0.52) as custo,
  SUM(valor_total * 0.48) as lucro
FROM db_gringao.pedidos
WHERE YEAR(data) >= YEAR(CURDATE()) - 2
GROUP BY YEAR(data)
ORDER BY YEAR(data)
```

---

## 📊 Queries de Comparação (Ano Atual vs Anterior)

### **Mensal - Comparação**
```sql
-- Loja Física
SELECT 
  MONTH(DATA) as mes,
  DATE_FORMAT(DATA, '%b') as mes_nome,
  YEAR(DATA) as ano,
  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita
FROM loja_fisica.caixas_venda
WHERE YEAR(DATA) >= YEAR(CURDATE()) - 1
GROUP BY YEAR(DATA), MONTH(DATA), DATE_FORMAT(DATA, '%b')
ORDER BY MONTH(DATA), YEAR(DATA)
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────┐
│ 1. Usuário seleciona período (Mensal)      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 2. Frontend chama tRPC                      │
│    trpc.analytics.getDashboardData.useQuery │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 3. Backend recebe request                   │
│    - schema: "loja_fisica"                  │
│    - period: "monthly"                      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 4. Backend monta SQL query                  │
│    SELECT ... FROM loja_fisica.caixas_venda │
│    WHERE YEAR(DATA) = YEAR(CURDATE())       │
│    GROUP BY MONTH(DATA)                     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 5. Executa query no MySQL                   │
│    executeExternalQuery(query, schema)      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 6. Retorna dados para frontend              │
│    { success: true, data: [...] }           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 7. Frontend processa dados                  │
│    - Calcula KPIs                           │
│    - Formata gráficos                       │
│    - Exibe na tela                          │
└─────────────────────────────────────────────┘
```

---

## 💡 Cálculos Realizados

### **Frontend calcula:**

1. **Receita Total**
```typescript
const receitaTotal = data.reduce((sum, item) => 
  sum + parseFloat(item.receita), 0
);
```

2. **Custo Total**
```typescript
const custoTotal = data.reduce((sum, item) => 
  sum + parseFloat(item.custo), 0
);
```

3. **Lucro Total**
```typescript
const lucroTotal = data.reduce((sum, item) => 
  sum + parseFloat(item.lucro), 0
);
```

4. **Margem de Lucro**
```typescript
const margemLucro = (lucroTotal / receitaTotal) * 100;
```

5. **Crescimento**
```typescript
const ultimo = data[data.length - 1].receita;
const penultimo = data[data.length - 2].receita;
const crescimento = ((ultimo - penultimo) / penultimo) * 100;
```

---

## 🎯 Estados do Dashboard

### **1. Loading**
```tsx
if (isLoading) {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className="animate-spin" />
      <span>Carregando dados...</span>
    </div>
  );
}
```

### **2. Sem Dados**
```tsx
if (!data || data.length === 0) {
  return (
    <div className="text-center">
      <p>Nenhum dado disponível</p>
      <p>Tente selecionar outro período</p>
    </div>
  );
}
```

### **3. Com Dados**
```tsx
// Renderiza KPIs e gráficos normalmente
```

---

## 📁 Arquivos Modificados

### **Backend**
```
✅ server/routers.ts
   - Adicionado getDashboardData
   - Adicionado getComparisonData
   - Queries SQL para cada período
   - Queries SQL para comparação
```

### **Frontend**
```
✅ client/src/pages/Dashboard.tsx
   - Removido dados mockados
   - Adicionado trpc.useQuery
   - Loading states
   - Error handling
   - Processamento de dados reais
```

---

## 🚀 Como Funciona

### **Exemplo: Buscar dados mensais da loja física**

1. **Usuário clica em "Mensal"**
```typescript
setPeriod("monthly")
```

2. **tRPC faz request automático**
```typescript
const { data, isLoading } = trpc.analytics.getDashboardData.useQuery({
  schema: "loja_fisica",
  period: "monthly"
});
```

3. **Backend executa SQL**
```sql
SELECT 
  DATE_FORMAT(DATA, '%b') as mes,
  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
  ...
FROM loja_fisica.caixas_venda
WHERE YEAR(DATA) = 2025
GROUP BY MONTH(DATA)
```

4. **Retorna dados**
```json
{
  "success": true,
  "data": [
    { "mes": "Jan", "receita": 434316, "custo": 226844, "lucro": 207472 },
    { "mes": "Fev", "receita": 448097, "custo": 234211, "lucro": 213886 },
    ...
  ]
}
```

5. **Frontend exibe**
- KPIs calculados
- Gráficos atualizados
- Tooltips formatados

---

## ⚠️ Observações Importantes

### **Cálculo de Custos**
```typescript
// Custo = 52% da receita (aproximação)
custo = receita * 0.52
lucro = receita * 0.48
```

**Nota:** Este é um cálculo aproximado. Em produção, deve-se usar custos reais do banco de dados.

### **Ticket Médio**
```typescript
// Ticket médio = Receita total / Número de períodos
ticketMedio = receitaTotal / data.length
```

**Nota:** Este é um cálculo simplificado. Para ticket médio real, deve-se dividir pela quantidade de transações.

---

## 🔍 Debugging

### **Ver dados retornados:**
```typescript
console.log("Dashboard Data:", dashboardData);
console.log("Comparison Data:", comparisonDataRaw);
```

### **Ver SQL executado:**
```typescript
// No backend (server/routers.ts)
console.log("[Dashboard] Executing query:", query);
```

### **Ver erros:**
```typescript
if (!dashboardData?.success) {
  console.error("Error:", dashboardData?.error);
}
```

---

## ✅ Benefícios

✅ **Dados Reais** - Sempre atualizados do banco  
✅ **Performance** - Queries otimizadas  
✅ **Escalável** - Funciona com qualquer volume de dados  
✅ **Manutenível** - Fácil adicionar novos períodos  
✅ **Type-safe** - tRPC garante tipos corretos  
✅ **Cache** - tRPC faz cache automático  

---

## 🎉 Resultado

**ANTES:**
- ❌ Dados mockados (estáticos)
- ❌ Não reflete realidade
- ❌ Precisa atualizar manualmente

**AGORA:**
- ✅ Dados reais do banco
- ✅ Sempre atualizados
- ✅ Atualização automática

---

**Última atualização**: 2025-11-08  
**Versão**: 3.0.0 (Dados Reais)

