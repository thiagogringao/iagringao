# 🏗️ Estrutura dos Dashboards

## 📋 Visão Geral

O sistema possui **2 dashboards independentes**, um para cada fonte de dados:

```
┌─────────────────────────────────────────────┐
│         JOALHERIA ANALYTICS                 │
├─────────────────────────────────────────────┤
│                                             │
│  🏪 LOJA FÍSICA                             │
│  ├─ Schema: loja_fisica                     │
│  ├─ Receita: R$ 3,1M                        │
│  ├─ Lucro: R$ 1,5M                          │
│  └─ Ticket: R$ 287,50                       │
│                                             │
│  🛒 E-COMMERCE                              │
│  ├─ Schema: db_gringao                      │
│  ├─ Receita: R$ 5,8M                        │
│  ├─ Lucro: R$ 2,8M                          │
│  └─ Ticket: R$ 407,00                       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🎯 Modos de Visualização

### 1. **Dashboard Geral** (Ambos)

Clique em "Dashboard Geral" na sidebar:

```
┌─────────────────────────────────────────────┐
│  🏪 Dashboard Loja Física                   │
│  ├─ KPIs (4 cards)                          │
│  ├─ Gráfico de Área (Receita/Custo/Lucro)  │
│  ├─ Gráfico de Barras (Comparação)         │
│  ├─ Gráfico de Pizza (Custos)              │
│  └─ Gráfico de Linha (Evolução)            │
├─────────────────────────────────────────────┤
│           ════════════════                  │  ← Separador
├─────────────────────────────────────────────┤
│  🛒 Dashboard E-commerce                    │
│  ├─ KPIs (4 cards)                          │
│  ├─ Gráfico de Área (Receita/Custo/Lucro)  │
│  ├─ Gráfico de Barras (Comparação)         │
│  ├─ Gráfico de Pizza (Custos)              │
│  └─ Gráfico de Linha (Evolução)            │
└─────────────────────────────────────────────┘
```

**Vantagens:**
- ✅ Comparação lado a lado
- ✅ Visão completa do negócio
- ✅ Scroll vertical para ver tudo

### 2. **Dashboard Individual**

Clique em "E-commerce" ou "Loja Física" na sidebar:

```
┌─────────────────────────────────────────────┐
│  🛒 Dashboard E-commerce                    │
│  ├─ KPIs (4 cards)                          │
│  ├─ Gráfico de Área (Receita/Custo/Lucro)  │
│  ├─ Gráfico de Barras (Comparação)         │
│  ├─ Gráfico de Pizza (Custos)              │
│  └─ Gráfico de Linha (Evolução)            │
└─────────────────────────────────────────────┘
```

**Vantagens:**
- ✅ Foco em um canal
- ✅ Análise detalhada
- ✅ Menos scroll

---

## 📊 Componentes do Dashboard

### **1. KPIs (Indicadores-Chave)**

```typescript
interface KPIs {
  receitaTotal: number;    // Receita total do período
  custoTotal: number;      // Custo total do período
  lucroTotal: number;      // Lucro (receita - custo)
  margemLucro: number;     // % de margem
  crescimento: number;     // % crescimento vs anterior
  ticketMedio: number;     // Valor médio por venda
}
```

### **2. Gráficos**

| Gráfico | Tipo | Dados | Objetivo |
|---------|------|-------|----------|
| Análise Temporal | Área | Receita, Custo, Lucro | Ver evolução no tempo |
| Comparação | Barras | Receita vs Custo | Comparar valores |
| Distribuição | Pizza | Categorias de custo | Ver % de cada custo |
| Evolução | Linha | Lucro | Acompanhar lucro |

### **3. Filtros de Período**

```typescript
type Period = "daily" | "weekly" | "monthly" | "yearly";

// Cada período tem dados específicos:
- daily: 7 dias
- weekly: 4 semanas
- monthly: 11 meses
- yearly: 3 anos
```

---

## 🔧 Implementação Técnica

### **Arquivo: `Dashboard.tsx`**

```typescript
interface DashboardProps {
  schema: "db_gringao" | "loja_fisica";
}

export default function Dashboard({ schema }: DashboardProps) {
  // Dados separados por schema
  const lojaFisicaData = { ... };
  const ecommerceData = { ... };
  
  // Seleciona dados baseado no schema
  const currentData = schema === "db_gringao" 
    ? ecommerceData 
    : lojaFisicaData;
  
  return (
    <div>
      <h1>{schema === "db_gringao" ? "🛒 E-commerce" : "🏪 Loja Física"}</h1>
      {/* Renderiza gráficos com dados específicos */}
    </div>
  );
}
```

### **Arquivo: `Home.tsx`**

```typescript
// Dashboard Geral (ambos)
{selectedSchema === "all" && (
  <div>
    <Dashboard schema="loja_fisica" />
    <Separator />
    <Dashboard schema="db_gringao" />
  </div>
)}

// Dashboard Individual
{selectedSchema !== "all" && (
  <div>
    {/* Chat interface normal */}
  </div>
)}
```

---

## 📊 Dados por Schema

### **🏪 Loja Física** (`loja_fisica`)

```typescript
{
  receitaTotal: 3107449,    // ~53% do e-commerce
  custoTotal: 1578673,      // ~52% do e-commerce
  lucroTotal: 1528776,      // ~55% do e-commerce
  margemLucro: 49.2,        // +1.5% vs e-commerce
  crescimento: 8.3,         // Mais estável
  ticketMedio: 287.50,      // Menor ticket
}
```

**Características:**
- Valores menores
- Mais estável
- Menos variação
- Margem maior

### **🛒 E-commerce** (`db_gringao`)

```typescript
{
  receitaTotal: 5817449,    // ~87% maior que loja
  custoTotal: 3040123,      // ~93% maior que loja
  lucroTotal: 2777326,      // ~82% maior que loja
  margemLucro: 47.7,        // -1.5% vs loja
  crescimento: 12.5,        // Mais crescimento
  ticketMedio: 407.00,      // Maior ticket
}
```

**Características:**
- Valores maiores
- Mais variação
- Picos de venda
- Margem menor

---

## 🎨 Identidade Visual

### **Cores por Métrica**

```typescript
const COLORS = {
  receita: "#005A8C",    // Azul (primária)
  custo: "#ef4444",      // Vermelho (perigo)
  lucro: "#10b981",      // Verde (sucesso)
  operacional: "#f59e0b", // Laranja (aviso)
};
```

### **Ícones por Schema**

```typescript
const ICONS = {
  loja_fisica: "🏪",     // Loja física
  db_gringao: "🛒",      // Carrinho de compras
};
```

---

## 🔄 Fluxo de Dados

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │
       ├─ Clica "Dashboard Geral"
       │  └─> Renderiza 2 dashboards
       │
       ├─ Clica "E-commerce"
       │  └─> Renderiza 1 dashboard (db_gringao)
       │
       └─ Clica "Loja Física"
          └─> Renderiza 1 dashboard (loja_fisica)

┌─────────────────────────────────────┐
│       Dashboard Component           │
├─────────────────────────────────────┤
│ 1. Recebe prop: schema              │
│ 2. Seleciona dados: currentData    │
│ 3. Renderiza KPIs                   │
│ 4. Renderiza gráficos               │
│ 5. Aplica formatação (R$)          │
└─────────────────────────────────────┘
```

---

## 📱 Responsividade

### **Desktop (> 1024px)**
```
┌─────────────────────────────────────┐
│ [KPI] [KPI] [KPI] [KPI]            │
│ [Gráfico Grande - Área]            │
│ [Gráfico 1] [Gráfico 2]            │
│ [Gráfico Grande - Linha]           │
└─────────────────────────────────────┘
```

### **Tablet (768px - 1024px)**
```
┌─────────────────────────────────────┐
│ [KPI] [KPI]                        │
│ [KPI] [KPI]                        │
│ [Gráfico Grande - Área]            │
│ [Gráfico 1]                        │
│ [Gráfico 2]                        │
│ [Gráfico Grande - Linha]           │
└─────────────────────────────────────┘
```

### **Mobile (< 768px)**
```
┌─────────────────────────────────────┐
│ [KPI]                              │
│ [KPI]                              │
│ [KPI]                              │
│ [KPI]                              │
│ [Gráfico - Área]                   │
│ [Gráfico 1]                        │
│ [Gráfico 2]                        │
│ [Gráfico - Linha]                  │
└─────────────────────────────────────┘
```

---

## 🚀 Próximas Melhorias

### **Curto Prazo**
- [ ] Integração com dados reais via tRPC
- [ ] Filtro de data personalizado (date picker)
- [ ] Comparação direta entre schemas

### **Médio Prazo**
- [ ] Exportação de relatórios PDF
- [ ] Alertas de performance (ex: queda > 10%)
- [ ] Gráficos de tendência com previsão

### **Longo Prazo**
- [ ] Dashboard customizável (drag & drop)
- [ ] Análise preditiva com IA
- [ ] Relatórios automáticos por email

---

## 📝 Exemplo de Uso

### **Cenário 1: Visão Geral**
```
1. Usuário clica "Dashboard Geral"
2. Sistema renderiza 2 dashboards
3. Usuário vê Loja Física (R$ 3,1M) e E-commerce (R$ 5,8M)
4. Usuário compara margens: Loja 49,2% vs E-commerce 47,7%
5. Conclusão: Loja física tem margem maior
```

### **Cenário 2: Análise Específica**
```
1. Usuário clica "E-commerce"
2. Sistema renderiza dashboard do e-commerce
3. Usuário clica "Mensal"
4. Usuário vê evolução de Jan a Nov
5. Usuário identifica pico em Maio (R$ 735k)
```

### **Cenário 3: Comparação de Períodos**
```
1. Usuário clica "Dashboard Geral"
2. Usuário clica "Anual" em ambos
3. Usuário compara crescimento:
   - Loja: 2023→2024 (+29%) | 2024→2025 (-9%)
   - E-commerce: 2023→2024 (+32%) | 2024→2025 (-9%)
4. Conclusão: Ambos cresceram em 2024, caíram em 2025
```

---

**Última atualização**: 2025-11-08  
**Versão**: 2.0.0 (Dashboards Separados)

