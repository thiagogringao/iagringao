# 📊 Como Funciona a Seleção de Schema

## 🎯 Visão Geral

A aplicação permite que você escolha qual banco de dados consultar através da **Sidebar**:

- 🛒 **E-commerce** → Schema `db_gringao` (Bling API)
- 🏪 **Loja Física** → Schema `loja_fisica` (PDV)
- 📈 **Dashboard Geral** → Deixa a LLM decidir (não recomendado)

---

## 🔄 Fluxo de Funcionamento

### 1. **Usuário Seleciona na Sidebar**

```
┌─────────────────────────┐
│ FONTE DE DADOS          │
├─────────────────────────┤
│ [✓] E-commerce          │  ← Clica aqui
│ [ ] Loja Física         │
│ [ ] Dashboard Geral     │
└─────────────────────────┘
```

### 2. **Estado é Atualizado**

```typescript
// Home.tsx
const [selectedSchema, setSelectedSchema] = useState("loja_fisica");

// Quando usuário clica em E-commerce:
setSelectedSchema("db_gringao")
```

### 3. **Pergunta é Enviada com Schema**

```typescript
queryMutation.mutate({
  question: "Qual foi o faturamento de hoje?",
  schema: "db_gringao",  // ✅ Schema selecionado
  llmProvider: "openrouter"
});
```

### 4. **Backend Usa o Schema Correto**

```typescript
// server/routers.ts
const schemaToUse = input.schema || analysis.schema;

// Executa query no schema correto
await executeExternalQuery(finalSQL, schemaToUse);
```

---

## 📋 Mapeamento de Schemas

| Seleção na Sidebar | Schema Enviado | Banco de Dados |
|-------------------|----------------|----------------|
| **E-commerce** | `db_gringao` | Bling API (175 pedidos) |
| **Loja Física** | `loja_fisica` | PDV (2.398.331 vendas) |
| **Dashboard Geral** | `undefined` | LLM decide automaticamente |

---

## ✅ Garantias do Sistema

### **1. Schema é SEMPRE Enviado**

```typescript
// Linha 56-60 de Home.tsx
const schemaToUse = selectedSchema === "all" ? undefined : selectedSchema;

queryMutation.mutate({
  question: input,
  schema: schemaToUse,  // ✅ Sempre enviado
  llmProvider: selectedProvider,
});
```

### **2. Backend Prioriza o Schema do Usuário**

```typescript
// server/routers.ts linha 61
const schemaToUse = input.schema || analysis.schema;
```

**Ordem de prioridade:**
1. ✅ Schema selecionado pelo usuário (input.schema)
2. ⚠️ Schema detectado pela LLM (analysis.schema)

### **3. Prompt da LLM Reforça o Schema**

```typescript
// server/llm-query-analyzer.ts
${forcedSchema ? `\n**IMPORTANTE:** Use APENAS o schema "${forcedSchema}".` : ""}
```

---

## 🎨 Feedback Visual

### **Estado Inicial (Padrão: Loja Física)**

```
┌─────────────────────────┐
│ FONTE DE DADOS          │
├─────────────────────────┤
│ [ ] E-commerce          │
│ [✓] Loja Física         │  ← Selecionado por padrão
│ [ ] Dashboard Geral     │
└─────────────────────────┘
```

### **Aviso Quando "Dashboard Geral" Está Selecionado**

```
⚠️ Dica: Selecione E-commerce ou Loja Física 
na sidebar para obter respostas mais precisas!
```

### **Header Mostra Schema Ativo**

```
┌─────────────────────────────────────┐
│ Loja Física                         │  ← Indica schema ativo
│ Usando Claude Sonnet 3.5            │
└─────────────────────────────────────┘
```

---

## 🔍 Exemplos Práticos

### **Exemplo 1: Pergunta no E-commerce**

```
1. Usuário clica em "E-commerce" na sidebar
2. selectedSchema = "db_gringao"
3. Usuário pergunta: "Qual foi o mês que vendemos menos?"
4. Sistema envia: { question: "...", schema: "db_gringao" }
5. LLM gera SQL para db_gringao.bling2_pedidos
6. Resultado: Dados do E-commerce
```

### **Exemplo 2: Pergunta na Loja Física**

```
1. Usuário clica em "Loja Física" na sidebar
2. selectedSchema = "loja_fisica"
3. Usuário pergunta: "Qual foi o mês que vendemos menos?"
4. Sistema envia: { question: "...", schema: "loja_fisica" }
5. LLM gera SQL para loja_fisica.caixas_venda
6. Resultado: Dados da Loja Física
```

---

## 🐛 Possíveis Problemas e Soluções

### **Problema 1: LLM Ignora o Schema Selecionado**

**Causa:** Cache do navegador ou prompt não está sendo enviado

**Solução:**
```bash
# Limpar cache do navegador (Ctrl + Shift + R)
# Ou reiniciar servidor
npm run dev
```

### **Problema 2: Resposta Vem do Schema Errado**

**Causa:** Estado não foi atualizado corretamente

**Solução:**
```typescript
// Verificar se o estado está correto
console.log("Schema selecionado:", selectedSchema);
```

### **Problema 3: "Dashboard Geral" Não Funciona Bem**

**Causa:** LLM pode escolher o schema errado

**Solução:**
```
✅ SEMPRE selecione E-commerce ou Loja Física
❌ Evite usar "Dashboard Geral"
```

---

## 📊 Dados Disponíveis por Schema

### **db_gringao (E-commerce)**
- ✅ 175 pedidos
- ✅ 5.308 itens de pedidos
- ✅ 5.945 produtos
- ✅ 11.654 clientes
- ✅ Dados de Janeiro/2025

### **loja_fisica (Loja Física)**
- ✅ 2.398.331 vendas
- ✅ 2.762 produtos
- ✅ 5.176 clientes
- ✅ Dados de Dez/2024 a Nov/2025

---

## 🎯 Melhores Práticas

### ✅ **FAÇA:**
- Selecione o schema antes de perguntar
- Use "E-commerce" para dados do Bling
- Use "Loja Física" para dados do PDV
- Verifique o header para confirmar o schema ativo

### ❌ **NÃO FAÇA:**
- Não use "Dashboard Geral" para perguntas específicas
- Não mude o schema no meio de uma análise
- Não assuma que a LLM vai escolher o schema certo

---

## 🔄 Resumo do Fluxo

```
Usuário Clica na Sidebar
         ↓
Estado Atualizado (selectedSchema)
         ↓
Header Mostra Schema Ativo
         ↓
Usuário Faz Pergunta
         ↓
Schema Enviado ao Backend
         ↓
LLM Recebe Schema Forçado
         ↓
SQL Gerado para Schema Correto
         ↓
Query Executada no Banco Certo
         ↓
Resultado Retornado
```

---

**Última atualização**: 2025-11-08
**Versão**: 1.3.0

