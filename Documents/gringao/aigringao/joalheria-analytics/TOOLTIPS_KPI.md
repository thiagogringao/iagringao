# 💡 Tooltips dos KPIs - Dashboard

## 🎯 Visão Geral

Cada KPI do dashboard agora possui um **tooltip informativo** que explica como o cálculo é feito. Basta passar o mouse sobre o card para ver a explicação detalhada.

---

## 🖱️ Como Usar

### **Passo 1: Identificar o KPI**
Todos os KPIs têm um pequeno ícone **ℹ️** ao lado do título:

```
┌─────────────────────────────────┐
│ Receita Total ℹ️                │
│ R$ 5.817.449,00                 │
└─────────────────────────────────┘
```

### **Passo 2: Passar o Mouse**
Passe o mouse sobre qualquer parte do card:

```
┌─────────────────────────────────┐
│ Receita Total ℹ️                │  ← Passe o mouse aqui
│ R$ 5.817.449,00                 │
└─────────────────────────────────┘
```

### **Passo 3: Ver Explicação**
Um tooltip aparecerá com:
- ✅ Fórmula de cálculo
- ✅ Exemplo prático
- ✅ Query SQL (quando aplicável)

---

## 📊 Tooltips Disponíveis

### **1. Receita Total** 💰

**Tooltip:**
```
┌─────────────────────────────────────┐
│ Como é calculado:                   │
│                                     │
│ Receita Total = Soma de todas as   │
│ vendas do período                   │
│                                     │
│ ─────────────────────────────────  │
│ SELECT SUM(valor_total)             │
│ FROM vendas                         │
└─────────────────────────────────────┘
```

**Explicação:**
- Soma todos os valores de vendas
- Inclui todas as transações do período
- Não desconta custos

**Exemplo:**
```
Venda 1: R$ 100,00
Venda 2: R$ 200,00
Venda 3: R$ 150,00
─────────────────────
Receita Total: R$ 450,00
```

---

### **2. Custo Total** 💸

**Tooltip:**
```
┌─────────────────────────────────────┐
│ Como é calculado:                   │
│                                     │
│ Custo Total = Produtos +            │
│ Operacional + Marketing + Outros    │
│                                     │
│ ─────────────────────────────────  │
│ • Produtos: 70% (R$ 2.128.086)     │
│ • Operacional: 20% (R$ 608.025)    │
│ • Marketing: 5% (R$ 152.006)       │
│ • Outros: 5% (R$ 152.006)          │
└─────────────────────────────────────┘
```

**Explicação:**
- Soma todos os custos operacionais
- Distribuição padrão: 70/20/5/5
- Inclui todas as categorias de custo

**Exemplo:**
```
Produtos: R$ 1.000,00 (70%)
Operacional: R$ 285,71 (20%)
Marketing: R$ 71,43 (5%)
Outros: R$ 71,43 (5%)
─────────────────────────
Custo Total: R$ 1.428,57
```

---

### **3. Lucro Total** 💚

**Tooltip:**
```
┌─────────────────────────────────────┐
│ Como é calculado:                   │
│                                     │
│ Lucro Total = Receita - Custo       │
│                                     │
│ ─────────────────────────────────  │
│ Receita: R$ 5.817.449,00           │
│ (-) Custo: R$ 3.040.123,00         │
│ (=) Lucro: R$ 2.777.326,00         │
│                                     │
│ ─────────────────────────────────  │
│ Margem = (Lucro/Receita) × 100     │
│        = 47,7%                      │
└─────────────────────────────────────┘
```

**Explicação:**
- Subtrai custos da receita
- Mostra cálculo detalhado
- Inclui cálculo da margem

**Exemplo:**
```
Receita: R$ 1.000,00
(-) Custo: R$ 600,00
─────────────────────
(=) Lucro: R$ 400,00

Margem = (400 / 1000) × 100 = 40%
```

---

### **4. Ticket Médio** 🎫

**Tooltip:**
```
┌─────────────────────────────────────┐
│ Como é calculado:                   │
│                                     │
│ Ticket Médio = Receita Total ÷     │
│ Número de Transações                │
│                                     │
│ ─────────────────────────────────  │
│ Exemplo: R$ 5.817.449 ÷ 14.290     │
│ vendas                              │
│                                     │
│ = R$ 407,00 por venda              │
│                                     │
│ ─────────────────────────────────  │
│ SELECT AVG(valor_total)             │
│ FROM vendas                         │
└─────────────────────────────────────┘
```

**Explicação:**
- Divide receita pelo número de vendas
- Mostra valor médio por transação
- Útil para estratégias de upsell

**Exemplo:**
```
Receita Total: R$ 1.000,00
Número de Vendas: 10
─────────────────────────
Ticket Médio: R$ 100,00
```

---

## 🎨 Recursos Visuais

### **Ícone de Informação**
```
ℹ️ - Indica que há tooltip disponível
```

### **Cursor**
```
cursor: help (?)
```
O cursor muda para um ponto de interrogação ao passar sobre o card.

### **Efeito Hover**
```
hover:shadow-md
```
O card ganha uma sombra ao passar o mouse, indicando interatividade.

### **Animação**
```
fade-in + zoom-in
```
O tooltip aparece com animação suave.

---

## 📐 Estrutura do Tooltip

### **Seção 1: Título**
```
Como é calculado:
```

### **Seção 2: Fórmula**
```
KPI = Componente1 + Componente2
```

### **Seção 3: Detalhamento** (opcional)
```
─────────────────────────────────
• Item 1: Valor
• Item 2: Valor
```

### **Seção 4: SQL** (opcional)
```
─────────────────────────────────
SELECT ... FROM ...
```

---

## 💡 Casos de Uso

### **Caso 1: Entender Margem de Lucro**
```
1. Veja Receita Total: R$ 5,8M
2. Veja Custo Total: R$ 3,0M
3. Passe mouse sobre "Lucro Total"
4. Veja cálculo: 5,8M - 3,0M = 2,8M
5. Veja margem: 47,7%
```

### **Caso 2: Analisar Distribuição de Custos**
```
1. Passe mouse sobre "Custo Total"
2. Veja distribuição:
   - Produtos: 70%
   - Operacional: 20%
   - Marketing: 5%
   - Outros: 5%
3. Identifique oportunidades de redução
```

### **Caso 3: Comparar Ticket Médio**
```
1. Veja Loja Física: R$ 287,50
2. Passe mouse, veja cálculo
3. Troque para E-commerce
4. Veja E-commerce: R$ 407,00
5. Compare: +42% no e-commerce
```

---

## 🎯 Benefícios

### **Para Usuários**
✅ **Transparência** - Entende como cada número é calculado  
✅ **Educação** - Aprende conceitos financeiros  
✅ **Confiança** - Valida os cálculos  
✅ **Contexto** - Vê exemplos práticos  

### **Para Gestores**
✅ **Auditoria** - Verifica fórmulas  
✅ **Treinamento** - Ensina equipe  
✅ **Decisões** - Baseia-se em dados claros  
✅ **Comunicação** - Explica métricas facilmente  

---

## 🔧 Implementação Técnica

### **Componente Usado**
```typescript
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
```

### **Estrutura Básica**
```tsx
<TooltipProvider>
  <TooltipTrigger asChild>
    <Card className="cursor-help hover:shadow-md">
      {/* Conteúdo do KPI */}
    </Card>
  </TooltipTrigger>
  <TooltipContent className="max-w-xs">
    <div className="space-y-1">
      <p className="font-semibold">Como é calculado:</p>
      <p className="text-xs">Fórmula...</p>
      {/* Detalhes adicionais */}
    </div>
  </TooltipContent>
</TooltipProvider>
```

### **Dependências**
```json
{
  "@radix-ui/react-tooltip": "^1.0.7"
}
```

---

## 📱 Responsividade

### **Desktop**
```
Tooltip aparece ao lado do card
Largura máxima: 320px (max-w-xs)
```

### **Tablet**
```
Tooltip aparece acima/abaixo do card
Ajusta posição automaticamente
```

### **Mobile**
```
Tooltip aparece em toque
Fecha ao tocar fora
```

---

## 🎨 Personalização

### **Cores**
```css
bg-popover: Fundo branco
text-popover-foreground: Texto escuro
border: Borda cinza clara
```

### **Tipografia**
```css
font-semibold: Título
text-xs: Conteúdo
font-mono: SQL queries
```

### **Espaçamento**
```css
px-3 py-1.5: Padding interno
space-y-1: Espaço entre linhas
```

---

## 🔍 Acessibilidade

### **Keyboard Navigation**
```
Tab: Navega entre KPIs
Enter/Space: Abre tooltip
Esc: Fecha tooltip
```

### **Screen Readers**
```
aria-label: "Informações sobre Receita Total"
role: "tooltip"
```

### **Visual Feedback**
```
Ícone ℹ️: Indica tooltip
Cursor help: Mostra interatividade
Sombra hover: Feedback visual
```

---

## 📊 Exemplo Completo

### **Fluxo de Uso**
```
1. Usuário abre Dashboard
2. Vê 4 KPIs com ícone ℹ️
3. Passa mouse sobre "Receita Total"
4. Tooltip aparece com:
   - Fórmula
   - Explicação
   - Query SQL
5. Usuário entende o cálculo
6. Move para próximo KPI
7. Repete processo
```

### **Resultado**
```
✅ Usuário entende todos os KPIs
✅ Confia nos números apresentados
✅ Pode explicar para outros
✅ Toma decisões informadas
```

---

## 🚀 Próximas Melhorias

### **Curto Prazo**
- [ ] Adicionar tooltips nos gráficos
- [ ] Incluir links para documentação
- [ ] Mostrar histórico de mudanças

### **Médio Prazo**
- [ ] Tooltips interativos (clicáveis)
- [ ] Comparação entre períodos no tooltip
- [ ] Exportar cálculos em PDF

### **Longo Prazo**
- [ ] Tooltips personalizáveis
- [ ] Tutorial guiado (onboarding)
- [ ] Vídeos explicativos integrados

---

**Última atualização**: 2025-11-08  
**Versão**: 1.0.0 (Tooltips nos KPIs)

