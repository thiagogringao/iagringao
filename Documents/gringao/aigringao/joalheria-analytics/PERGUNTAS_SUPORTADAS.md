# 📋 Perguntas Suportadas pelo Sistema

O sistema agora entende e responde automaticamente a diversos tipos de perguntas sobre seus dados, para **qualquer período** (dia, mês, ano, semestre, etc).

## ✅ Tipos de Perguntas Suportadas

### 1. 📦 Quantidade de Produtos Vendidos

**Exemplos de perguntas:**
- "Quantidade de produtos vendidos em outubro de 2025"
- "Quantos produtos foram vendidos em março de 2024"
- "Produtos vendidos em 15 de janeiro de 2025"
- "Quantidade de produtos vendidos hoje"
- "Produtos vendidos no primeiro semestre de 2024"
- "Quantos produtos vendemos ontem"
- "Produtos vendidos na última semana"

**SQL gerado:** `SUM(QUANTIDADE)`

---

### 2. 👥 Quantidade de Clientes

**Exemplos de perguntas:**
- "Quantidade de clientes que compraram em outubro de 2025"
- "Quantos clientes compraram em dezembro de 2023"
- "Clientes que compraram em novembro"
- "Quantidade de clientes em 2024"
- "Quantos clientes compraram hoje"
- "Clientes que compraram este mês"

**SQL gerado:** `COUNT(DISTINCT CODIGO_CLIENTE)`

---

### 3. 📊 Quantidade por Atendimento (Média)

**Exemplos de perguntas:**
- "Quantidade vendida por atendimento em outubro de 2025"
- "Média de produtos por venda em 2024"
- "Quantos produtos em média por venda em março"
- "Média de itens por boleta em novembro de 2025"

**SQL gerado:** `AVG(quantidade por BOLETA)`

---

### 4. 💰 Valor Total de Compras

**Exemplos de perguntas:**
- "Valor total de compras em outubro de 2025"
- "Quanto foi o total de compras em março"
- "Valor de compras em 2024"
- "Total de compras hoje"
- "Compras do último mês"

**SQL gerado:** `SUM(VALOR_SUBT)`

---

### 5. 💵 Valor Total de Custo

**Exemplos de perguntas:**
- "Valor total de custo em outubro de 2025"
- "Custo total em dezembro de 2023"
- "Quanto foi o custo em 2024"
- "Custo total da última semana"
- "Custo de hoje"

**SQL gerado:** `SUM(VALOR_CUSTO_SUBT)`

---

### 6. 💸 Valor Total de Vendas (Faturamento)

**Exemplos de perguntas:**
- "Valor total de vendas em outubro de 2025"
- "Faturamento de novembro de 2024"
- "Quanto vendemos em março"
- "Vendas de hoje"
- "Faturamento de ontem"
- "Vendas do primeiro semestre de 2025"
- "Quanto faturamos este mês"

**SQL gerado:** `SUM(VALOR_SUBT - VALOR_DESCONTO)`

---

## 📅 Períodos Suportados

O sistema entende diversos formatos de período:

### Períodos Específicos
- ✅ **Mês e Ano**: "outubro de 2025", "março de 2024"
- ✅ **Data Específica**: "15 de janeiro de 2025", "20/03/2024"
- ✅ **Ano Completo**: "2024", "2025"
- ✅ **Semestre**: "primeiro semestre de 2025", "segundo semestre de 2024"
- ✅ **Trimestre**: "primeiro trimestre de 2024"

### Períodos Relativos
- ✅ **Hoje**: "hoje", "vendas de hoje"
- ✅ **Ontem**: "ontem", "faturamento de ontem"
- ✅ **Este Mês**: "este mês", "mês atual"
- ✅ **Mês Passado**: "mês passado"
- ✅ **Esta Semana**: "esta semana"
- ✅ **Última Semana**: "última semana", "últimos 7 dias"
- ✅ **Este Ano**: "este ano", "ano atual"

### Comparações
- ✅ "Compare outubro com novembro de 2025"
- ✅ "Compare agosto desse ano com o do ano passado"
- ✅ "Diferença entre primeiro e segundo semestre"
- ✅ "Vendas de 2024 vs 2025"

---

## 🎯 Exemplos Práticos

### Exemplo 1: Análise Mensal
```
Pergunta: "Quantidade de produtos vendidos em outubro de 2025"
Resposta: "Em outubro de 2025, foram vendidos 94.199 produtos..."
```

### Exemplo 2: Análise de Clientes
```
Pergunta: "Quantos clientes compraram em dezembro de 2023"
Resposta: "Em dezembro de 2023, 1.234 clientes únicos realizaram compras..."
```

### Exemplo 3: Análise Financeira
```
Pergunta: "Valor total de vendas em março de 2024"
Resposta: "O faturamento em março de 2024 foi de R$ 582.035,87..."
```

### Exemplo 4: Comparação
```
Pergunta: "Compare outubro com novembro de 2025"
Resposta: "Comparando os períodos:
• Outubro: R$ 150.000,00
• Novembro: R$ 180.000,00
Crescimento de 20%..."
```

---

## 🚀 Como Usar

1. **Abra a aplicação** em http://localhost:5173
2. **Selecione o schema** na sidebar:
   - "Loja Física" para dados do PDV
   - "E-commerce" para dados do Bling
3. **Faça sua pergunta** em linguagem natural
4. **Receba a resposta** com:
   - Resposta em português
   - Dados formatados
   - Insights automáticos
   - SQL executado

---

## 💡 Dicas

- ✅ Seja específico com o período: "outubro de 2025" é melhor que "outubro"
- ✅ Use linguagem natural: o sistema entende variações
- ✅ Combine métricas: "valor de vendas e quantidade de produtos em março"
- ✅ Experimente comparações: "compare X com Y"

---

## 📝 Observações

- O sistema automaticamente detecta se há dados disponíveis para o período solicitado
- Se não houver dados, o sistema sugere períodos alternativos com dados disponíveis
- Todas as respostas incluem valores formatados no padrão brasileiro (R$ 1.234,56)
- As queries são cacheadas para melhor performance







