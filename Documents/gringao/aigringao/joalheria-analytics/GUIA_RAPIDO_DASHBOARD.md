# 🚀 Guia Rápido - Dashboard Financeiro

## 📋 Interface Principal

```
┌─────────────────────────────────────────────────────────────┐
│  🏪 Dashboard Loja Física                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [🏪 Loja Física] [🛒 E-commerce]    [Diário] [Semanal]   │
│   ↑ Alternar fonte                    ↑ Alternar período   │
│                                       [Mensal] [Anual]      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Receita Total] [Custo Total] [Lucro Total] [Ticket]      │
│   ↑ KPIs (4 cards)                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Gráfico de Área (Receita/Custo/Lucro)                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📊 Gráfico de Barras    │  📊 Gráfico de Pizza            │
│  (Comparação)            │  (Distribuição)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Gráfico de Linha (Evolução do Lucro)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Como Usar em 3 Passos

### **1️⃣ Abrir Dashboard**
```
Sidebar → Clique em "Dashboard Geral"
```

### **2️⃣ Escolher Fonte de Dados**
```
Clique em: 🏪 Loja Física  OU  🛒 E-commerce
```

### **3️⃣ Escolher Período**
```
Clique em: Diário | Semanal | Mensal | Anual
```

---

## 🔄 Cenários de Uso

### **Cenário 1: Comparar Loja vs E-commerce**

```
1. Abra o Dashboard
2. Veja Loja Física (padrão)
   - Receita: R$ 3,1M
   - Margem: 49,2%
3. Clique em "🛒 E-commerce"
   - Receita: R$ 5,8M (+87%)
   - Margem: 47,7% (-1,5%)
4. Conclusão: E-commerce tem mais receita, mas margem menor
```

### **Cenário 2: Analisar Tendência Mensal**

```
1. Abra o Dashboard
2. Clique em "Mensal"
3. Veja gráfico de área com 11 meses
4. Identifique pico em Maio (R$ 736k no e-commerce)
5. Identifique queda em Novembro (dados parciais)
```

### **Cenário 3: Ver Performance Diária**

```
1. Abra o Dashboard
2. Clique em "Diário"
3. Veja últimos 7 dias
4. Identifique dia com maior venda (dia 06: R$ 23k)
5. Compare com custo do mesmo dia (R$ 12k)
```

### **Cenário 4: Análise de Custos**

```
1. Abra o Dashboard
2. Role até o gráfico de pizza
3. Veja distribuição:
   - 70% Produtos
   - 20% Operacional
   - 5% Marketing
   - 5% Outros
4. Identifique oportunidades de redução
```

---

## 🎨 Controles Interativos

### **Botões de Schema**

| Botão | Ação | Resultado |
|-------|------|-----------|
| 🏪 Loja Física | Clique | Mostra dados da loja física |
| 🛒 E-commerce | Clique | Mostra dados do e-commerce |

**Estado Visual:**
- ✅ **Ativo**: Fundo azul (#005A8C), texto branco
- ⚪ **Inativo**: Fundo branco, borda cinza

### **Botões de Período**

| Botão | Dados | Quantidade |
|-------|-------|------------|
| Diário | Últimos dias | 7 dias |
| Semanal | Últimas semanas | 4 semanas |
| Mensal | Meses de 2025 | 11 meses |
| Anual | Anos recentes | 3 anos |

**Estado Visual:**
- ✅ **Ativo**: Fundo azul, texto branco
- ⚪ **Inativo**: Fundo branco, borda cinza

---

## 📊 Interpretando os Gráficos

### **1. Gráfico de Área (Principal)**

```
┌─────────────────────────────────────┐
│    Receita ▲                        │
│           ╱╲                        │
│    Custo ╱  ╲  Lucro               │
│         ╱    ╲╱                     │
│        ╱                            │
└─────────────────────────────────────┘
```

**O que ver:**
- 📈 **Receita** (azul) - Linha superior
- 📉 **Custo** (vermelho) - Linha intermediária
- 💚 **Lucro** (verde) - Diferença entre receita e custo

**Como interpretar:**
- ✅ Lucro crescente = Negócio saudável
- ⚠️ Custo próximo da receita = Margem baixa
- 🎯 Distância entre linhas = Margem de lucro

### **2. Gráfico de Barras (Comparação)**

```
┌─────────────────────────────────────┐
│  ██ Receita                         │
│  ██ Custo                           │
│  ██                                 │
│  ██                                 │
└─────────────────────────────────────┘
```

**O que ver:**
- Barras azuis = Receita
- Barras vermelhas = Custo
- Lado a lado para comparação

**Como interpretar:**
- ✅ Barra azul > vermelha = Lucro
- ⚠️ Barras similares = Margem baixa
- 🎯 Diferença = Lucro absoluto

### **3. Gráfico de Pizza (Distribuição)**

```
┌─────────────────────────────────────┐
│         ╱───╲                       │
│        │ 70% │  Produtos            │
│        │ 20% │  Operacional         │
│         ╲───╱                       │
└─────────────────────────────────────┘
```

**O que ver:**
- 🟦 Azul = Produtos (70%)
- 🟨 Amarelo = Operacional (20%)
- 🟩 Verde = Marketing (5%)
- 🟧 Laranja = Outros (5%)

**Como interpretar:**
- 📦 Produtos = Maior custo (normal)
- 🏢 Operacional = Segundo maior
- 📣 Marketing = Oportunidade de otimização
- 💡 Outros = Custos diversos

### **4. Gráfico de Linha (Evolução)**

```
┌─────────────────────────────────────┐
│      ●───●                          │
│     ╱     ╲    ●                    │
│    ●       ●──●                     │
└─────────────────────────────────────┘
```

**O que ver:**
- Linha verde = Lucro ao longo do tempo
- Pontos = Valores específicos

**Como interpretar:**
- 📈 Linha subindo = Crescimento
- 📉 Linha descendo = Queda
- 📊 Linha estável = Consistência

---

## 💡 Dicas de Uso

### **✅ Boas Práticas**

1. **Compare Períodos**
   ```
   Mensal → Veja tendência de 11 meses
   Anual → Veja crescimento de 3 anos
   ```

2. **Alterne entre Schemas**
   ```
   Loja Física → Veja performance presencial
   E-commerce → Veja performance online
   Compare margens e receitas
   ```

3. **Use Tooltips**
   ```
   Passe o mouse sobre gráficos
   Veja valores exatos em R$
   ```

4. **Analise KPIs**
   ```
   Receita Total → Volume de vendas
   Margem de Lucro → Eficiência
   Crescimento → Tendência
   Ticket Médio → Valor por venda
   ```

### **⚠️ Evite**

1. ❌ Comparar períodos diferentes entre schemas
   - Sempre use o mesmo período para comparação justa

2. ❌ Ignorar os KPIs
   - KPIs dão contexto aos gráficos

3. ❌ Focar apenas em receita
   - Margem de lucro é mais importante que volume

---

## 🎯 Atalhos Visuais

### **Cores dos Indicadores**

| Cor | Significado | Exemplo |
|-----|-------------|---------|
| 🟦 Azul | Receita | R$ 5,8M |
| 🟥 Vermelho | Custo | R$ 3,0M |
| 🟩 Verde | Lucro | R$ 2,8M |
| 🟪 Roxo | Ticket Médio | R$ 407 |

### **Ícones dos Schemas**

| Ícone | Schema | Perfil |
|-------|--------|--------|
| 🏪 | Loja Física | Menor, estável |
| 🛒 | E-commerce | Maior, variável |

### **Símbolos de Tendência**

| Símbolo | Significado |
|---------|-------------|
| 📈 | Crescimento positivo |
| 📉 | Queda |
| 📊 | Estável |
| ⚠️ | Atenção necessária |
| ✅ | Performance boa |

---

## 🔍 Perguntas Frequentes

### **Q: Como comparar Loja vs E-commerce?**
```
A: Clique em "🏪 Loja Física", anote os valores
   Clique em "🛒 E-commerce", compare
   Use a mesma visualização de período
```

### **Q: Qual período devo usar?**
```
A: Depende do objetivo:
   - Diário: Monitoramento diário
   - Semanal: Tendências semanais
   - Mensal: Análise de meses (recomendado)
   - Anual: Visão estratégica
```

### **Q: Os dados são reais?**
```
A: Atualmente são mockados (teste)
   Em produção, virão do banco de dados real via tRPC
```

### **Q: Posso exportar os dados?**
```
A: Sim! Use o botão "Exportar" nos gráficos
   Formatos: CSV, Excel, PNG
```

### **Q: Como ver dados de um mês específico?**
```
A: Clique em "Mensal"
   Passe o mouse sobre o gráfico
   Veja o tooltip com dados do mês
```

---

## 🚀 Fluxo Completo de Análise

```
┌─────────────────────────────────────────────────────┐
│ 1. Abrir Dashboard                                  │
│    └─> Sidebar → "Dashboard Geral"                 │
│                                                     │
│ 2. Escolher Schema                                  │
│    └─> "🏪 Loja Física" ou "🛒 E-commerce"        │
│                                                     │
│ 3. Escolher Período                                 │
│    └─> "Diário" | "Semanal" | "Mensal" | "Anual" │
│                                                     │
│ 4. Analisar KPIs                                    │
│    └─> Receita, Custo, Lucro, Margem              │
│                                                     │
│ 5. Explorar Gráficos                                │
│    └─> Área, Barras, Pizza, Linha                 │
│                                                     │
│ 6. Comparar Schemas                                 │
│    └─> Alternar entre Loja e E-commerce           │
│                                                     │
│ 7. Tomar Decisões                                   │
│    └─> Baseado nos insights obtidos               │
└─────────────────────────────────────────────────────┘
```

---

**Última atualização**: 2025-11-08  
**Versão**: 2.0.0 (Alternância de Schema)

