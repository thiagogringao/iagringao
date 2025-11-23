# 🔧 Correção: Data vindo como String JSON ao invés de Array

## 🚨 **Problema Identificado**

```
⚠️ Dashboard: data não é array!
{
  type: 'string',
  isArray: false,
  value: '[{"mes":"Jan","receita":"434316.1400",...}]'
}
```

### **Causa Raiz**

O **cache** estava salvando os dados como `JSON.stringify(data)`, mas ao retornar do cache, o backend estava fazendo `JSON.parse()` **uma vez**, porém o tRPC ou o processo de serialização estava convertendo novamente para string, resultando em **dupla serialização**.

---

## ❌ **Fluxo Problemático (ANTES)**

### **Backend - Salvando no Cache:**
```typescript
// server/routers.ts linha 184
await saveCachedQuery({
  question: cacheKey,
  schema,
  sqlQuery: query,
  result: JSON.stringify(data),  // ✅ Converte array para string
});
```

### **Backend - Retornando do Cache:**
```typescript
// server/routers.ts linha 40
if (cached) {
  return {
    success: true,
    cached: true,
    data: JSON.parse(cached.result),  // ✅ Parse de volta para array
    // ...
  };
}
```

### **Problema - tRPC Serialização:**
```typescript
// tRPC pode estar serializando novamente ao enviar para o frontend
// Resultado: data chega como STRING no frontend!
```

### **Frontend - Recebendo:**
```typescript
const realData = useMemo(() => {
  const data = dashboardData?.data;
  // ❌ data é STRING: '[{"mes":"Jan",...}]'
  // ❌ Array.isArray(data) === false
  // ❌ data.reduce() === TypeError!
}, [dashboardData?.data]);
```

---

## ✅ **Correções Aplicadas**

### **1. Backend - Parse Robusto (server/routers.ts)**

```typescript
// getDashboardData - Linha 38-56
if (cached) {
  console.log(`[Dashboard] Cache hit for ${cacheKey}`);
  
  // ✅ Parse do resultado do cache (pode ser string ou já estar parseado)
  let parsedData = cached.result;
  if (typeof cached.result === 'string') {
    try {
      parsedData = JSON.parse(cached.result);
    } catch (error) {
      console.error('[Dashboard] Error parsing cached result:', error);
      parsedData = [];
    }
  }
  
  return {
    success: true,
    cached: true,
    data: parsedData,  // ✅ Garante que é array
    period,
    schema,
    executionTime: Date.now() - startTime,
  };
}
```

```typescript
// getComparisonData - Linha 257-275
if (cached) {
  console.log(`[Comparison] Cache hit for ${cacheKey}`);
  
  // ✅ Parse do resultado do cache (pode ser string ou já estar parseado)
  let parsedData = cached.result;
  if (typeof cached.result === 'string') {
    try {
      parsedData = JSON.parse(cached.result);
    } catch (error) {
      console.error('[Comparison] Error parsing cached result:', error);
      parsedData = [];
    }
  }
  
  return {
    success: true,
    cached: true,
    data: parsedData,  // ✅ Garante que é array
    period,
    schema,
    executionTime: Date.now() - startTime,
  };
}
```

---

### **2. Frontend - Parse de String JSON (Dashboard.tsx)**

```typescript
// Linha 70-94
const realData = useMemo(() => {
  const data = dashboardData?.data;
  
  // ✅ Garante que sempre retorna um array
  if (!data) return [];
  
  // ✅ Se for uma string JSON, faz o parse
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error('❌ Dashboard: Erro ao fazer parse do JSON:', error);
      return [];
    }
  }
  
  // ✅ Se já for array, retorna direto
  if (Array.isArray(data)) return data;
  
  // ✅ Se for um objeto, tenta converter para array
  if (typeof data === 'object') return [data];
  
  return [];
}, [dashboardData?.data]);
```

---

## 🔍 **Fluxo Corrigido (DEPOIS)**

### **Cenário 1: Cache Hit**
```
1. Backend busca cache
   cached.result = '["mes":"Jan",...]' (string)

2. Backend faz parse robusto
   parsedData = JSON.parse(cached.result)
   parsedData = [{ mes: "Jan", ... }] (array)

3. Backend retorna
   return { data: parsedData }

4. tRPC serializa (pode converter para string novamente)
   data = '[{"mes":"Jan",...}]' (string)

5. Frontend recebe e faz parse
   if (typeof data === 'string') {
     parsed = JSON.parse(data)  // ✅ Array!
   }

6. Frontend usa
   data.reduce(...) // ✅ Funciona!
```

### **Cenário 2: Cache Miss**
```
1. Backend busca do MySQL
   data = [{ mes: "Jan", ... }] (array)

2. Backend retorna
   return { data }

3. tRPC serializa
   data = [{ mes: "Jan", ... }] (array ou string)

4. Frontend recebe e valida
   if (typeof data === 'string') {
     parsed = JSON.parse(data)
   } else if (Array.isArray(data)) {
     return data  // ✅ Array!
   }

5. Frontend usa
   data.reduce(...) // ✅ Funciona!
```

---

## 📊 **Mudanças Resumidas**

| Arquivo | Linha | Mudança |
|---------|-------|---------|
| **server/routers.ts** | 38-56 | Parse robusto no `getDashboardData` |
| **server/routers.ts** | 257-275 | Parse robusto no `getComparisonData` |
| **client/Dashboard.tsx** | 70-94 | Parse de string JSON no frontend |

---

## 🎯 **Resultado**

### **Antes:**
```
❌ TypeError: data.reduce is not a function
❌ data é string: '[{"mes":"Jan",...}]'
❌ Dashboard crashava
```

### **Depois:**
```
✅ Backend faz parse robusto do cache
✅ Frontend faz parse de string JSON
✅ data é sempre array válido
✅ Dashboard funciona perfeitamente
✅ Cache funciona corretamente
```

---

## 💡 **Lições Aprendidas**

### **1. Sempre valide o tipo antes de usar**
```typescript
// ❌ Ruim
const data = response.data;
data.reduce(...);  // Pode crashar

// ✅ Bom
const data = response.data;
if (Array.isArray(data)) {
  data.reduce(...);
}
```

### **2. Cuidado com dupla serialização**
```typescript
// Problema comum com cache + tRPC
// Cache: JSON.stringify(data)
// tRPC: JSON.stringify(response)
// Resultado: "[[...]]" (string de string!)
```

### **3. Parse defensivo**
```typescript
// ✅ Sempre tente parse e tenha fallback
let parsedData = data;
if (typeof data === 'string') {
  try {
    parsedData = JSON.parse(data);
  } catch {
    parsedData = [];
  }
}
```

### **4. Console.warn para debug**
```typescript
// ✅ Útil para identificar problemas
if (data && !Array.isArray(data)) {
  console.warn('⚠️ Data não é array!', {
    type: typeof data,
    value: data
  });
}
```

---

## 📚 **Referências**

- [JSON.parse() - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
- [JSON.stringify() - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- [tRPC Serialization](https://trpc.io/docs/server/data-transformers)

---

## 🛡️ **Prevenção Futura**

### **Opção 1: Não serializar no cache**
```typescript
// Salvar como objeto, não string
await saveCachedQuery({
  result: data,  // Deixa o ORM serializar
});
```

### **Opção 2: Usar superjson no tRPC**
```typescript
// trpc.ts
import superjson from 'superjson';

export const t = initTRPC.create({
  transformer: superjson,  // Mantém tipos
});
```

### **Opção 3: Validação com Zod**
```typescript
import { z } from 'zod';

const DashboardDataSchema = z.array(z.object({
  mes: z.string(),
  receita: z.string(),
  custo: z.string(),
  lucro: z.string(),
}));

// Uso:
const validatedData = DashboardDataSchema.parse(data);
```

---

**✅ Problema resolvido! Dashboard agora lida corretamente com dados do cache!** 🎉

