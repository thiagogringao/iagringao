# 📊 Funcionalidades de Exportação - Comparações

## 🎯 Visão Geral

Quando você faz uma **comparação entre períodos** na aplicação, agora tem opções para exportar os dados em diferentes formatos!

---

## 📋 Exportação de Tabelas

Quando uma comparação é exibida em formato de **tabela**, você verá dois botões no canto superior direito:

### 1. **Botão CSV** 📄
- **Formato**: Arquivo CSV (Comma-Separated Values)
- **Uso**: Ideal para importar em outras ferramentas de análise
- **Nome do arquivo**: `comparacao_YYYY-MM-DD.csv`
- **Compatível com**: Excel, Google Sheets, Python, R, etc.

### 2. **Botão Excel** 📊
- **Formato**: Arquivo XLS (Excel)
- **Uso**: Abre diretamente no Microsoft Excel
- **Nome do arquivo**: `comparacao_YYYY-MM-DD.xls`
- **Compatível com**: Microsoft Excel, LibreOffice Calc

---

## 📈 Exportação de Gráficos

Quando uma comparação é exibida em formato de **gráfico** (barras, linhas, pizza), você verá um botão:

### **Botão "Exportar PNG"** 🖼️
- **Formato**: Imagem PNG de alta qualidade
- **Resolução**: 2x (alta definição)
- **Nome do arquivo**: `grafico_comparacao_YYYY-MM-DD.png`
- **Uso**: Ideal para apresentações, relatórios, documentos

---

## 🚀 Como Usar

### Passo 1: Faça uma Comparação
Pergunte algo como:
```
"Compare outubro de 2025 com setembro de 2025"
"Compare julho com agosto de 2025"
"Faturamento de outubro vs novembro"
```

### Passo 2: Escolha a Visualização
A aplicação vai mostrar automaticamente:
- **Tabela**: Para comparações numéricas detalhadas
- **Gráfico**: Para visualização visual das diferenças

### Passo 3: Exporte os Dados
Clique no botão de exportação desejado:
- **CSV/Excel**: Para análise em planilhas
- **PNG**: Para usar em apresentações

---

## 📊 Exemplo de Dados Exportados

### CSV/Excel:
```
Período,Faturamento,Total Pedidos
Outubro de 2025,582035.87,4534
Setembro de 2025,530705.07,3068
```

### PNG:
Um gráfico de barras ou linhas mostrando visualmente a comparação entre os períodos.

---

## 💡 Dicas

1. **Use CSV** quando precisar fazer análises adicionais em Python, R ou outras ferramentas
2. **Use Excel** quando quiser editar ou formatar os dados manualmente
3. **Use PNG** quando precisar incluir o gráfico em apresentações PowerPoint, relatórios PDF, etc.

---

## 🎨 Recursos Visuais

### Tabela com Botões de Exportação:
```
┌─────────────────────────────────────────────┐
│ Comparação entre Períodos    [CSV] [Excel] │
├─────────────────────────────────────────────┤
│ Período          │ Faturamento │ Vendas    │
│ Outubro/2025     │ R$ 582k     │ 4,534     │
│ Setembro/2025    │ R$ 530k     │ 3,068     │
└─────────────────────────────────────────────┘
```

### Gráfico com Botão de Exportação:
```
┌─────────────────────────────────────────────┐
│ Comparação entre Períodos  [Exportar PNG]  │
├─────────────────────────────────────────────┤
│                                             │
│     █████████                               │
│     █████████  ████████                     │
│     █████████  ████████                     │
│     Outubro    Setembro                     │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔧 Tecnologias Utilizadas

- **CSV/Excel**: Geração nativa com JavaScript Blob API
- **PNG**: html2canvas para captura de alta qualidade do gráfico
- **Formatação**: Mantém formatação brasileira (R$, vírgulas, pontos)

---

## ✅ Benefícios

✅ **Portabilidade**: Leve seus dados para qualquer ferramenta
✅ **Apresentações**: Gráficos prontos para usar
✅ **Análise Avançada**: Exporte para ferramentas especializadas
✅ **Relatórios**: Inclua dados em documentos oficiais
✅ **Compartilhamento**: Envie dados para colegas facilmente

---

**Última atualização**: 2025-11-08
**Versão**: 1.1.0


