# 📊 Dashboard Financeiro

## 🎯 Visão Geral

O Dashboard Financeiro é uma página dedicada que mostra análises completas de **custos**, **receitas** e **lucros** com visualizações em diferentes períodos.

**Cada schema tem seu próprio dashboard com dados específicos:**
- 🛒 **E-commerce** (`db_gringao`) - Vendas online, maior volume
- 🏪 **Loja Física** (`loja_fisica`) - Vendas presenciais, mais estável

---

## 🚀 Como Acessar

### **Passo 1: Abrir Dashboard**
1. **Clique em "Dashboard Geral"** na sidebar
2. O dashboard será exibido (inicia com Loja Física)

### **Passo 2: Alternar entre Schemas**
Use os botões no topo do dashboard:

```
┌─────────────────────────────────────────┐
│ Dashboard Loja Física                   │
├─────────────────────────────────────────┤
│                                         │
│ [🏪 Loja Física] [🛒 E-commerce]       │ ← Clique para alternar
│                                         │
│ [Diário] [Semanal] [Mensal] [Anual]   │ ← Filtros de período
│                                         │
└─────────────────────────────────────────┘
```

### **Navegação na Sidebar**

```
┌─────────────────────────┐
│ FONTE DE DADOS          │
├─────────────────────────┤
│ [ ] E-commerce          │  ← Chat com IA
│ [ ] Loja Física         │  ← Chat com IA
│ [✓] Dashboard Geral     │  ← Dashboard visual
└─────────────────────────┘
```

---

## 🔄 Diferenças entre Schemas

### 🏪 **Loja Física** (`loja_fisica`)

**Características:**
- 💰 Receita Total: **R$ 3.107.449,00**
- 📊 Margem de Lucro: **49,2%**
- 🎫 Ticket Médio: **R$ 287,50**
- 📈 Crescimento: **8,3%**

**Perfil:**
- Valores menores e mais estáveis
- Menos variação diária
- Foco em atendimento presencial
- Custos operacionais menores

### 🛒 **E-commerce** (`db_gringao`)

**Características:**
- 💰 Receita Total: **R$ 5.817.449,00**
- 📊 Margem de Lucro: **47,7%**
- 🎫 Ticket Médio: **R$ 407,00**
- 📈 Crescimento: **12,5%**

**Perfil:**
- Valores maiores e mais variação
- Picos de vendas online
- Foco em marketing digital
- Custos operacionais maiores

### 📊 **Comparação Visual**

```
┌────────────────────────────────────────┐
│         LOJA FÍSICA vs E-COMMERCE      │
├────────────────────────────────────────┤
│                                        │
│ Receita:                               │
│ 🏪 R$ 3,1M  ████████                  │
│ 🛒 R$ 5,8M  ███████████████           │
│                                        │
│ Lucro:                                 │
│ 🏪 R$ 1,5M  ████████                  │
│ 🛒 R$ 2,8M  ███████████████           │
│                                        │
│ Ticket Médio:                          │
│ 🏪 R$ 287   ████████                  │
│ 🛒 R$ 407   ███████████               │
└────────────────────────────────────────┘
```

---

## 📊 Funcionalidades

### 1. **Alternância de Schema** (NOVO! 🎉)

Botões no topo à esquerda para alternar entre fontes de dados:

```
┌─────────────────────────────────────┐
│ [🏪 Loja Física] [🛒 E-commerce]   │
└─────────────────────────────────────┘
```

**Como usar:**
- ✅ Clique em **🏪 Loja Física** para ver dados da loja
- ✅ Clique em **🛒 E-commerce** para ver dados online
- ✅ Alternância instantânea sem recarregar
- ✅ Mantém o período selecionado (Diário/Semanal/etc)

**Vantagens:**
- 🚀 Comparação rápida entre canais
- 🎯 Foco em um canal por vez
- 📱 Interface limpa e organizada
- ⚡ Transição suave entre dados

### 2. **Filtros de Período**

Botões no topo à direita para alternar entre períodos:

```
┌─────────────────────────────────────────────────┐
│ [Diário] [Semanal] [Mensal] [Anual]            │
└─────────────────────────────────────────────────┘
```

- 📅 **Diário** - Últimos 7 dias
- 📅 **Semanal** - Últimas 4 semanas
- 📅 **Mensal** - Últimos 11 meses
- 📅 **Anual** - Últimos 3 anos

### 3. **KPIs (Indicadores-Chave)**

Quatro cards principais:

#### **Receita Total**
- 💰 Valor total de vendas
- 📈 Crescimento vs período anterior
- 🎨 Cor: Azul (#005A8C)

#### **Custo Total**
- 💸 Valor total de custos
- 📊 Percentual da receita
- 🎨 Cor: Laranja

#### **Lucro Total**
- 💚 Receita - Custo
- 📈 Margem de lucro (%)
- 🎨 Cor: Verde

#### **Ticket Médio**
- 🎫 Valor médio por transação
- 📊 Calculado por venda
- 🎨 Cor: Roxo

---

## 📈 Gráficos Disponíveis

### 1. **Gráfico de Área - Análise Temporal**

```
┌─────────────────────────────────────┐
│ Análise Mensal            [Exportar]│
├─────────────────────────────────────┤
│                                     │
│    ╱╲    ╱╲                        │
│   ╱  ╲  ╱  ╲    ╱╲                │
│  ╱    ╲╱    ╲  ╱  ╲               │
│ ╱            ╲╱    ╲              │
│                                     │
│ Jan Feb Mar Abr Mai Jun Jul Ago    │
│                                     │
│ ━ Receita  ━ Custo  ━ Lucro       │
└─────────────────────────────────────┘
```

**Características:**
- ✅ 3 linhas: Receita, Custo, Lucro
- ✅ Área preenchida com gradiente
- ✅ Tooltip formatado em R$
- ✅ Botão de exportação

### 2. **Gráfico de Barras - Comparação**

```
┌─────────────────────────────────────┐
│ Comparação Receita vs Custo         │
├─────────────────────────────────────┤
│                                     │
│  ██                                 │
│  ██  ██                             │
│  ██  ██  ██                         │
│  ██  ██  ██  ██                     │
│ Jan Feb Mar Abr                     │
│                                     │
│ ■ Receita  ■ Custo                 │
└─────────────────────────────────────┘
```

**Características:**
- ✅ Barras lado a lado
- ✅ Comparação visual direta
- ✅ Cores: Azul (receita) e Vermelho (custo)

### 3. **Gráfico de Pizza - Distribuição de Custos**

```
┌─────────────────────────────────────┐
│ Distribuição de Custos              │
├─────────────────────────────────────┤
│                                     │
│         ╱───╲                       │
│        │  70% │  Produtos           │
│        │ 20%  │  Operacional        │
│         ╲───╱   5% Marketing        │
│                 5% Outros           │
│                                     │
└─────────────────────────────────────┘
```

**Características:**
- ✅ Mostra % de cada categoria
- ✅ 4 categorias principais
- ✅ Cores distintas
- ✅ Labels com percentuais

### 4. **Gráfico de Linha - Evolução do Lucro**

```
┌─────────────────────────────────────┐
│ Evolução do Lucro                   │
├─────────────────────────────────────┤
│                                     │
│      ●───●                          │
│     ╱     ╲    ●                    │
│    ●       ●──●                     │
│   ╱                                 │
│  ●                                  │
│ Jan Feb Mar Abr Mai Jun             │
│                                     │
│ ━ Lucro                            │
└─────────────────────────────────────┘
```

**Características:**
- ✅ Linha única focada no lucro
- ✅ Pontos destacados
- ✅ Linha grossa (3px)
- ✅ Cor verde

---

## 💰 Formatação de Valores

Todos os valores são formatados no padrão brasileiro:

| Valor | Formatação |
|-------|------------|
| 5817449 | R$ 5.817.449,00 |
| 3040123 | R$ 3.040.123,00 |
| 47.7 | 47,7% |

---

## 🎨 Cores do Dashboard

```typescript
COLORS = {
  primary: "#005A8C",    // Azul (Receita)
  secondary: "#3b82f6",  // Azul claro
  success: "#10b981",    // Verde (Lucro)
  warning: "#f59e0b",    // Laranja
  danger: "#ef4444",     // Vermelho (Custo)
}
```

---

## 📊 Dados Exibidos

### **Período Diário (7 dias)**
- Receita, Custo e Lucro por dia
- Últimos 7 dias

### **Período Semanal (4 semanas)**
- Receita, Custo e Lucro por semana
- Últimas 4 semanas

### **Período Mensal (11 meses)**
- Receita, Custo e Lucro por mês
- Janeiro a Novembro de 2025

### **Período Anual (3 anos)**
- Receita, Custo e Lucro por ano
- 2023, 2024, 2025

---

## 🔄 Interatividade

### **Tooltip Customizado**
Ao passar o mouse sobre os gráficos:

```
┌─────────────────────┐
│ Outubro             │
│                     │
│ Receita: R$ 582k    │
│ Custo: R$ 304k      │
│ Lucro: R$ 278k      │
└─────────────────────┘
```

### **Botões de Período**
- ✅ Clique para alternar
- ✅ Botão ativo em azul
- ✅ Atualização instantânea

### **Botão Exportar**
- 📥 Exporta dados do gráfico
- 📊 Formato: CSV ou PNG
- 🎯 Localizado no header do gráfico

---

## 📱 Responsividade

### **Desktop (> 1024px)**
- 4 KPIs em linha
- 2 gráficos lado a lado
- Layout completo

### **Tablet (768px - 1024px)**
- 2 KPIs por linha
- 1 gráfico por linha
- Layout adaptado

### **Mobile (< 768px)**
- 1 KPI por linha
- 1 gráfico por linha
- Scroll vertical

---

## 🎯 Casos de Uso

### **1. Análise Diária**
```
Pergunta: "Como estão as vendas hoje?"
Ação: Clique em "Diário"
Resultado: Veja últimos 7 dias
```

### **2. Comparação Mensal**
```
Pergunta: "Qual mês teve mais lucro?"
Ação: Clique em "Mensal"
Resultado: Compare todos os meses
```

### **3. Tendência Anual**
```
Pergunta: "Estamos crescendo?"
Ação: Clique em "Anual"
Resultado: Veja evolução 2023-2025
```

### **4. Análise de Custos**
```
Pergunta: "Onde gastamos mais?"
Ação: Veja gráfico de pizza
Resultado: Distribuição de custos
```

---

## 🔧 Integração com Backend

### **Dados Mockados (Atual)**
```typescript
// Dashboard.tsx usa dados estáticos
const monthlyData = [
  { mes: "Jan", receita: 434316, custo: 226844, lucro: 207472 },
  // ...
];
```

### **Dados Reais (Futuro)**
```typescript
// Usar tRPC para buscar dados reais
const { data } = trpc.analytics.getDashboardData.useQuery({
  schema: "loja_fisica",
  period: "monthly"
});
```

---

## 🚀 Próximas Melhorias

- [ ] Integração com dados reais via tRPC
- [ ] Filtro de data personalizado
- [ ] Comparação entre schemas (E-commerce vs Loja)
- [ ] Exportação de relatórios PDF
- [ ] Alertas de performance
- [ ] Previsões com IA

---

## 📝 Exemplo de Uso

```typescript
// 1. Usuário clica em "Dashboard Geral"
setSelectedSchema("all")

// 2. Home.tsx renderiza Dashboard
{selectedSchema === "all" && (
  <Dashboard schema="loja_fisica" />
)}

// 3. Dashboard mostra todos os gráficos
// 4. Usuário pode alternar períodos
// 5. Usuário pode exportar dados
```

---

**Última atualização**: 2025-11-08
**Versão**: 1.0.0

