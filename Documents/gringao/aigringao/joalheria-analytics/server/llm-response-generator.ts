import { callLLM, type LLMProvider } from "./llm-config";

export async function generateNaturalResponse(
  question: string,
  sqlQuery: string,
  results: any[],
  provider: LLMProvider,
  availablePeriods: Array<{ year: number; month: number; monthName: string }> = [],
  isComparison: boolean = false
): Promise<{ answer: string; insights: string[] }> {
  console.log("[LLM Response] Generating response for", results.length, "results");
  console.log("[LLM Response] Is comparison:", isComparison);
  console.log("[LLM Response] Available periods:", availablePeriods.length);

  const systemPrompt = `Você é um Consultor de Inteligência de Negócios Sênior especializado em joalherias.
Sua missão é transformar dados brutos em insights estratégicos acionáveis.

OBJETIVOS DA RESPOSTA:
1. **Responda Diretamente:** Comece com a resposta objetiva da pergunta.
2. **Analise, Não Apenas Descreva:**
   - Calcule o Ticket Médio (Faturamento / Vendas) se tiver os dados.
   - Identifique tendências (crescimento/queda) se houver dados históricos.
   - Compare com metas implícitas (ex: "Isso representa um desempenho sólido...").
3. **Seja Consultivo:**
   - Sugira ações baseadas nos dados (ex: "Considerando o alto estoque de X, uma promoção pode ser efetiva").
   - Alerte sobre anomalias (ex: "Atenção: Margem de lucro abaixo do esperado").
4. **Formatação Impecável (Markdown):**
   - Use **negrito** para todos os números e métricas importantes.
   - Use listas (bullets) para facilitar a leitura.
   - Use separadores ou quebras de linha para organizar o texto.

REGRAS DE FORMATAÇÃO (CRÍTICAS):
- **Moeda Brasileira:** SEMPRE formate como R$ X.XXX,XX (ex: R$ 1.250,50).
- **Datas:** Use formato brasileiro (dd/mm/aaaa) ou por extenso (Outubro de 2025).
- **Precisão:** Mantenha 2 casas decimais para valores monetários.

TRATAMENTO DE DADOS:
- **Com Dados:** Apresente os números, analise o contexto e sugira próximos passos.
- **Sem Dados:**
  - Não peça desculpas excessivas. Seja profissional.
  - Explique tecnicamente (ex: "Não há registros de vendas neste período").
  - Sugira proativamente um período que você SABE que tem dados (ex: "Tente analisar o mês anterior").

Exemplo de Tom Esperado:
"O faturamento de outubro foi de **R$ 150.000,00**, com um ticket médio de **R$ 500,00**. Isso indica uma estabilidade em relação ao mês anterior. Sugiro focar em produtos de maior valor agregado para elevar o ticket médio."`;

  const periodsInfo = availablePeriods.length > 0
    ? `\n\nPERÍODOS COM DADOS DISPONÍVEIS:\n${availablePeriods.map(p => `- ${p.monthName} de ${p.year}`).join('\n')}`
    : '';

  const comparisonInfo = isComparison
    ? `\n\n**TIPO DE ANÁLISE: COMPARAÇÃO ENTRE PERÍODOS**\nOs resultados contêm dados de múltiplas queries executadas separadamente para cada período.`
    : '';

  const userPrompt = `PERGUNTA: "${question}"
  
  SQL EXECUTADO: ${sqlQuery}
  
  RESULTADOS: ${JSON.stringify(results, null, 2)}${periodsInfo}${comparisonInfo}
  
  **INSTRUÇÕES FINAIS:** 
  - Se houver dados suficientes, CALCULE métricas derivadas (Ticket Médio, % de Lucro).
  - Use **Markdown** para estruturar a resposta (títulos, bullets, negrito).
  - Se for uma comparação, destaque explicitamente a diferença (R$ e %) entre os períodos.
  - Se a lista de resultados estiver vazia, use a lista de "PERÍODOS COM DADOS DISPONÍVEIS" para sugerir uma nova análise.
  
  Gere uma resposta em JSON:
  {
    "answer": "Texto completo da resposta formatado em Markdown",
    "insights": ["Insight estratégico 1", "Ação sugerida 2", "Alerta de anomalia 3"]
  }`;

  const response = await callLLM(
    provider,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.7, maxTokens: 1000 }
  );

  // Sanitiza JSON
  let jsonContent = response.content.trim();
  jsonContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  jsonContent = jsonContent.replace(/[\x00-\x1F\x7F]/g, "");

  try {
    const parsed = JSON.parse(jsonContent);
    console.log("[LLM Response] ✅ Response generated successfully");
    return parsed;
  } catch (error) {
    console.error("[LLM Response] ❌ Failed to parse:", jsonContent);
    console.error("[LLM Response] Error:", error);
    return {
      answer: "Desculpe, não consegui gerar uma resposta adequada.",
      insights: [],
    };
  }
}

