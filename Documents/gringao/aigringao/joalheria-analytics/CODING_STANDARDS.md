# 📐 Padrões de Código - Joalheria Analytics

Este documento descreve os padrões e convenções usados no projeto.

## 🎨 Formatação de Valores

### Princípio Fundamental

**Quantidade ≠ Valor Monetário**

A aplicação diferencia automaticamente entre:
- **Quantidades** (unidades, peças, vendas) → sem R$
- **Valores monetários** (faturamento, preço, custo) → com R$

### Implementação

Toda a lógica de formatação está centralizada em:

```typescript
// client/src/lib/formatters.ts
export function formatNumberValue(columnName: string, value: any): string
```

### Regras de Detecção

#### 1. 📦 QUANTIDADE (Prioridade 1)

**Palavras-chave:**
- `quantidade`, `qtd`, `qtde`
- `unidades`, `pecas`, `peças`
- `vendas`, `pedidos`
- `total_vendido`
- `itens`, `produtos`, `clientes`
- `count`, `numero`

**Formato:**
```typescript
64 → "64"
1234 → "1.234"
1234.5 → "1.234,5"
```

**Exemplo:**
```
Quantidade Total: 64
Total de Vendas: 15
Produtos Vendidos: 1.234
```

#### 2. 💰 MONETÁRIO (Prioridade 2)

**Palavras-chave:**
- `faturamento`
- `valor`, `preco`, `preço`
- `custo`, `receita`, `lucro`
- `saldo`, `total`

**Formato:**
```typescript
15 → "R$ 15,00"
1234.5 → "R$ 1.234,50"
582035.87 → "R$ 582.035,87"
```

**Exemplo:**
```
Faturamento: R$ 582.035,87
Valor Total: R$ 15,00
Preço Médio: R$ 1.234,50
```

#### 3. 🟡 HEURÍSTICA (Prioridade 3)

Se não identificar por palavra-chave:
- Tem decimais OU valor > 10.000 → **Monetário**
- Caso contrário → **Quantidade**

### Uso nos Componentes

#### MetricsCards (KPIs)

```tsx
import { formatNumberValue } from "@/lib/formatters";

<div className="text-3xl font-bold">
  {formatNumberValue(key, value)}
</div>
```

#### DataTable (Tabelas)

```tsx
import { formatNumberValue } from "@/lib/formatters";

function renderCell(columnName: string, value: any) {
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    return formatNumberValue(columnName, value);
  }
  return String(value);
}
```

## 🖼️ Exibição de Imagens

### Detecção Automática

Colunas com nomes contendo:
- `imagem`, `image`
- `imagemURL`, `imageURL`

São automaticamente renderizadas como `<img>` ao invés de texto.

### Implementação

```tsx
function renderCell(columnName: string, value: any) {
  if (columnName.toLowerCase().includes("imagem")) {
    return (
      <img
        src={value}
        alt="Produto"
        className="h-16 w-16 object-cover rounded-md"
        onError={(e) => {
          // Fallback para placeholder SVG
          e.target.src = "data:image/svg+xml,...";
        }}
      />
    );
  }
  // ...
}
```

### Fallback

Se a imagem não carregar, exibe um placeholder SVG com texto "Sem imagem".

## 📊 Nomes de Colunas

### Mapeamento Amigável

```typescript
const columnMap = {
  codigo: "Código",
  nome: "Nome",
  imagemURL: "Imagem",
  quantidade_vendida: "Quantidade",
  valor_total: "Valor Total",
  // ...
};
```

### Formatação Automática

Para colunas não mapeadas:
```
quantidade_vendida → Quantidade Vendida
total_pedidos → Total Pedidos
```

## 🔍 SQL e LLM

### Instruções para LLM

Ao listar produtos, **SEMPRE** incluir:
```sql
SELECT 
  p.codigo,
  p.nome,
  p.imagemURL,  -- ⚠️ OBRIGATÓRIO para mostrar imagens
  SUM(dp.quantidade) AS total_vendido
FROM ...
GROUP BY p.codigo, p.nome, p.imagemURL  -- ⚠️ Incluir no GROUP BY
```

### Datas em db_gringao

**SEMPRE** usar datas fixas de janeiro/2025:
```sql
WHERE dp.data BETWEEN '2025-01-01' AND '2025-01-31'
```

**NÃO usar:**
- `CURDATE()`
- `INTERVAL`
- `YEAR()`, `MONTH()`

## 📝 Convenções de Código

### TypeScript

- Sempre tipar parâmetros e retornos
- Usar `interface` para props de componentes
- Usar `type` para unions e aliases

### React

- Componentes funcionais com hooks
- Props tipadas com `interface`
- Extrair lógica complexa para funções auxiliares

### Imports

Ordem:
1. React e bibliotecas externas
2. Componentes internos (`@/components`)
3. Utilitários (`@/lib`)
4. Tipos (`@/types`)

### Nomenclatura

- Componentes: `PascalCase`
- Funções: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Arquivos: `kebab-case.tsx` ou `PascalCase.tsx` (componentes)

## 🧪 Testes

### Formatação

Sempre testar com:
- Valores inteiros pequenos (< 100)
- Valores grandes (> 10.000)
- Valores decimais
- Valores nulos/undefined

### Exemplo

```typescript
formatNumberValue("quantidade", 64) // "64"
formatNumberValue("quantidade", 1234) // "1.234"
formatNumberValue("faturamento", 64) // "R$ 64,00"
formatNumberValue("faturamento", 582035.87) // "R$ 582.035,87"
```

## 📚 Referências

- `client/src/lib/formatters.ts` - Lógica de formatação
- `client/src/components/MetricsCards.tsx` - Uso em KPIs
- `client/src/components/DataTable.tsx` - Uso em tabelas
- `server/llm-query-analyzer.ts` - Instruções para LLM

