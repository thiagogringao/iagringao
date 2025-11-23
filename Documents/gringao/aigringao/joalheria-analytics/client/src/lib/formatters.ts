/**
 * Utilitários de formatação de valores
 * Padrão unificado para toda a aplicação
 */

/**
 * Formata valores numéricos de forma inteligente
 * 
 * Regras:
 * 1. QUANTIDADE (sem R$): quantidade, qtd, unidades, peças, vendas, pedidos, etc.
 * 2. MONETÁRIO (com R$): faturamento, valor, preço, custo, receita, lucro, etc.
 * 3. HEURÍSTICA: Se tem decimais ou > 10.000 → R$, caso contrário → número normal
 * 
 * @param columnName - Nome da coluna (usado para detectar o tipo)
 * @param value - Valor a ser formatado
 * @returns String formatada
 */
export function formatNumberValue(columnName: string, value: any): string {
  const keyLower = columnName.toLowerCase();
  
  // 🔴 PRIMEIRO: Detecta CÓDIGOS e IDs (verifica ANTES de converter para número)
  const isCode = /codigo|código|id|internal|interno|sku|ref|referencia|referência/i.test(columnName);
  
  if (isCode) {
    // Para CODIGO_INTERNO, remove zeros à esquerda excessivos para melhor visualização
    if (/codigo_interno|código_interno|interno/i.test(columnName)) {
      const strValue = String(value);
      // Remove zeros à esquerda excessivos
      // Exemplo: "0000000023380" → "023380"
      // Conta quantos zeros há no início
      const leadingZerosMatch = strValue.match(/^0+/);
      if (leadingZerosMatch && leadingZerosMatch[0].length > 3) {
        // Se tem mais de 3 zeros, remove os excessivos mas mantém um zero inicial
        const withoutExcessZeros = strValue.replace(/^0{4,}/, '0');
        return withoutExcessZeros;
      }
      // Se tem 3 ou menos zeros, ou não começa com zero, retorna como está
      return strValue;
    }
    // Para outros códigos, retorna o valor original
    return String(value);
  }

  // Converte para número se for string numérica (após verificar códigos)
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (typeof numValue !== "number" || isNaN(numValue)) {
    return String(value);
  }
  
  // 🟠 SEGUNDO: Detecta se é QUANTIDADE (não deve ser R$)
  const isQuantity = /quantidade|qtd|qtde|unidades|pecas|peças|vendas|pedidos|total_vendido|itens|produtos|clientes|count|numero|media_mensal|^vendida$/i.test(columnName);
  
  if (isQuantity) {
    // Formata apenas com separador de milhares, sem R$
    return numValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  
  // 🟢 TERCEIRO: Detecta se é valor MONETÁRIO (deve ser R$)
  const isMonetary = /faturamento|valor|preco|preço|custo|receita|lucro|saldo|total|compra|venda|^atual$/i.test(columnName);
  
  if (isMonetary) {
    return numValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  
  // 🟡 QUARTO: Se não identificou, usa heurística
  // Se tem decimais ou é grande, provavelmente é monetário
  if (numValue % 1 !== 0 || numValue > 10000) {
    return numValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  
  // Números inteiros pequenos (contagens)
  return numValue.toLocaleString("pt-BR");
}

/**
 * Formata o nome de uma coluna para exibição
 * Exemplo: "quantidade_vendida" → "Quantidade Vendida"
 */
export function formatColumnName(columnName: string): string {
  // Mapeamento de nomes de colunas para nomes mais amigáveis
  const columnMap: Record<string, string> = {
    codigo: "Código",
    nome: "Nome",
    imagemURL: "Imagem",
    imageurl: "Imagem",
    quantidade_vendida: "Quantidade",
    valor_total: "Valor Total",
    total_vendido: "Total Vendido",
    preco: "Preço",
    estoque: "Estoque",
  };

  const lowerName = columnName.toLowerCase();
  if (columnMap[lowerName]) {
    return columnMap[lowerName];
  }

  // Capitaliza e substitui underscores por espaços
  return columnName
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Formata um label removendo underscores e capitalizando
 */
export function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim();
}

/**
 * Formata valor como moeda brasileira (R$)
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata valor para tooltip de gráfico
 * Detecta automaticamente se é monetário ou quantidade
 */
export function formatChartValue(key: string, value: number): string {
  // Se o valor for null ou undefined, retorna vazio
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  const keyLower = key.toLowerCase();
  
  // Detecta se é quantidade (não monetário)
  const isQuantity = /quantidade|qtd|qtde|unidades|pecas|peças|total_vendido|itens|produtos|clientes|count|numero|^vendas$|^pedidos$/i.test(key);
  
  if (isQuantity) {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  
  // Detecta se é monetário (faturamento, valor, preço, custo, etc)
  const isMonetary = /faturamento|valor|preco|preço|custo|receita|lucro|saldo|total|compra|venda/i.test(key);
  
  if (isMonetary || value > 1000) {
    // Por padrão, assume que valores grandes são monetários
    return formatCurrency(value);
  }
  
  // Números pequenos sem contexto
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

