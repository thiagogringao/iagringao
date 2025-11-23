import { callLLM, type LLMProvider } from "./llm-config";

export interface QueryAnalysis {
  sqlQuery: string;
  explanation: string;
  visualizationType: "card" | "table" | "chart";
  chartType?: "line" | "bar" | "pie";
  schema: "db_gringao" | "loja_fisica";
  confidence: number;
  isComparison?: boolean;
  comparisonQueries?: Array<{
    label: string;
    sqlQuery: string;
    period: string;
  }>;
}

export async function analyzeQuestion(
  question: string,
  schema: "db_gringao" | "loja_fisica" | undefined,
  provider: LLMProvider
): Promise<QueryAnalysis> {
  const systemPrompt = buildSystemPrompt(schema);
  const userPrompt = `Pergunta do usuário: "${question}"`;

  console.log("[LLM] 🔍 Question:", question);
  console.log("[LLM] 📊 Schema:", schema || "auto-detect");
  console.log("[LLM] ✅ Using UPDATED prompt (dynamic dates)");

  const response = await callLLM(
    provider,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.3, maxTokens: 4000 }
  );

  // Sanitiza e parseia JSON
  let jsonContent = response.content.trim();
  console.log("[LLM] Raw response length:", jsonContent.length);

  // Remove blocos de código markdown
  jsonContent = jsonContent
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  // Remove caracteres de controle invisíveis
  jsonContent = jsonContent.replace(/[\x00-\x1F\x7F]/g, "");

  // Extrai apenas o primeiro objeto JSON válido (balanceando chaves)
  const firstBrace = jsonContent.indexOf('{');
  if (firstBrace !== -1) {
    let braceCount = 0;
    let endPos = firstBrace;

    for (let i = firstBrace; i < jsonContent.length; i++) {
      if (jsonContent[i] === '{') braceCount++;
      if (jsonContent[i] === '}') braceCount--;

      if (braceCount === 0) {
        endPos = i + 1;
        break;
      }
    }

    jsonContent = jsonContent.substring(firstBrace, endPos);
  }

  try {
    const analysis: QueryAnalysis = JSON.parse(jsonContent);
    console.log("[LLM] ✅ JSON parsed successfully");
    return analysis;
  } catch (error: any) {
    console.error("[LLM] ❌ Failed to parse JSON");
    console.error("[LLM] Content length:", jsonContent.length);
    console.error("[LLM] Content (first 500 chars):", jsonContent.slice(0, 500));
    console.error("[LLM] Content (last 100 chars):", jsonContent.slice(-100));
    console.error("[LLM] Error:", error.message);

    // Se o JSON está incompleto, tenta completar com valores padrão
    if (error.message.includes("Unexpected end of JSON input")) {
      console.log("[LLM] Tentando recuperar JSON incompleto...");

      // Tenta adicionar as chaves que faltam
      if (!jsonContent.includes('"schema"')) {
        jsonContent += ', "schema": "' + (schema || 'db_gringao') + '"';
      }
      if (!jsonContent.includes('"confidence"')) {
        jsonContent += ', "confidence": 80';
      }
      if (!jsonContent.endsWith('}')) {
        jsonContent += '}';
      }

      try {
        const analysis: QueryAnalysis = JSON.parse(jsonContent);
        console.log("[LLM] ✅ JSON recuperado com sucesso");
        return analysis;
      } catch (retryError) {
        console.error("[LLM] ❌ Falha ao recuperar JSON");
      }
    }

    throw new Error(`Falha ao analisar a pergunta: ${error.message}. Tente novamente ou use outro modelo LLM.`);
  }
}

function buildSystemPrompt(forcedSchema?: "db_gringao" | "loja_fisica"): string {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const dateInfo = `DATA ATUAL: ${currentDate.toISOString().split('T')[0]} (${currentYear}-${String(currentMonth).padStart(2, '0')})`;

  return `Você é um especialista em análise de dados de joalheria e geração de SQL para MySQL 5.7.

${dateInfo}

🔴 INSTRUÇÕES SOBRE DATAS E PERÍODOS:
- **O usuário escolhe o schema através da sidebar** (E-commerce ou Loja Física)
- **SEMPRE use o schema fornecido pelo usuário**
- **EXTRAIA exatamente o período mencionado na pergunta do usuário**
- **Busque os dados do período solicitado, independente de haver ou não dados**

🔴 **ATENÇÃO CRÍTICA - PERÍODOS MÚLTIPLOS:**
- **"todos os meses"**, **"o ano todo"**, **"meses de 2025"**, **"mensal"**:
  * NÃO filtre por mês específico!
  * Use: WHERE YEAR(DATA) = 2025 (SEM filtro de mês)
  * Use: GROUP BY MONTH(DATA) ou DATE_FORMAT(DATA, '%Y-%m')
  * Retorna TODOS os meses, não apenas um!
- **Exemplo ERRADO**: WHERE DATA BETWEEN '2025-01-01' AND '2025-01-31' (só janeiro!)
- **Exemplo CERTO**: WHERE YEAR(DATA) = 2025 GROUP BY MONTH(DATA) (todos os meses!)

- **INTERPRETE variações de perguntas:**
  * "quantidade de produtos vendidos" = SUM(QUANTIDADE)
  * "quantos clientes" / "quantidade de clientes" = COUNT(DISTINCT CODIGO_CLIENTE)
  * "quantidade por atendimento" / "média por venda" = AVG de produtos por BOLETA
  * "valor de compras" / "valor total" = SUM(VALOR_SUBT)
  * "valor de custo" / "custo total" = SUM(VALOR_CUSTO_SUBT)
  * "valor de vendas" / "faturamento" = SUM(VALOR_SUBT - VALOR_DESCONTO)
  * 🔴 **"foto", "imagem", "photo", "image", "mostre a foto", "com foto"** (loja_fisica) = OBRIGATÓRIO usar vw_dprodutos com LPAD e incluir vw.img

**db_gringao** (E-commerce - Bling API):
  * Coluna de data: "data" (minúscula, tipo DATE)
  * NÃO use CURDATE(), INTERVAL - use datas fixas
  * Formato: WHERE data BETWEEN '2025-10-01' AND '2025-10-31'
  
**loja_fisica** (PDV - Loja Física):
  * Coluna de data: "DATA" (MAIÚSCULA, tipo DATETIME)
  * Para períodos relativos pode usar CURDATE()
  * Formato: WHERE DATE(DATA) BETWEEN '2025-10-01' AND '2025-10-31'
  * Exemplos:
    - "outubro de 2025" → WHERE DATE(DATA) BETWEEN '2025-10-01' AND '2025-10-31'
    - "este mês" → WHERE YEAR(DATA) = YEAR(CURDATE()) AND MONTH(DATA) = MONTH(CURDATE())
    - "hoje" → WHERE DATE(DATA) = CURDATE()
    - "2024" → WHERE YEAR(DATA) = 2024

**CONVERSÃO DE PERÍODOS:**
- Janeiro → 01, Fevereiro → 02, Março → 03, Abril → 04, Maio → 05, Junho → 06
- Julho → 07, Agosto → 08, Setembro → 09, Outubro → 10, Novembro → 11, Dezembro → 12
- "primeiro semestre" → meses 01 a 06
- "segundo semestre" → meses 07 a 12
- "primeiro trimestre" → meses 01 a 03

- As respostas são CACHEADAS para melhor performance

SCHEMAS DISPONÍVEIS (conforme dicionário de dados):

**db_gringao (E-commerce - Bling API):**

1. vw_revenue (VIEW - Receitas agregadas desde 2023):
   - Colunas: data (date), receita (decimal), custo (decimal), lucro (decimal), transacoes (int)
   - Chave: data
   - Uso: Use esta view para queries de dashboard e análises de receita/custo/lucro
   - ⚠️ IMPORTANTE: Esta view contém dados desde 2023, use para análises históricas
   - Exemplo: SELECT SUM(receita) FROM db_gringao.vw_revenue WHERE YEAR(data) = 2024

2. bling2_pedidos (tabela base):
   - Colunas: id (bigint), numero (int), numeroLoja (varchar50), data (date), dataSaida (date), 
     dataPrevista (date), totalProdutos (decimal10,2), total (decimal10,2), contato_id (bigint), 
     contato_tipoPessoa (char1), situacao_id (int), situacao_valor (int), loja_id (bigint)
   - Chave: id
   - ⚠️ Para análises de receita/custo/lucro, prefira usar vw_revenue
   
3. bling2_detalhes_pedidos (5,308 registros - ITENS DOS PEDIDOS):
   - Colunas: id (bigint), data (date), codigo (varchar50), quantidade (int), 
     valor (decimal10,2), desconto (decimal10,2)
   - Chave: id, codigo
   - Relacionamentos:
     * id = bling2_pedidos.id (para dados do pedido)
     * codigo = bling2_produtos.codigo (para dados do produto)
   
4. bling2_produtos (5,945 registros):
   - Colunas: id (bigint), idProdutoPai (bigint), nome (varchar255), codigo (varchar50), 
     preco (decimal10,2), precoCusto (decimal10,2), estoque (int), tipo (varchar10), 
     situacao (varchar20), formato (varchar20), imagemURL (varchar255)
   - Chave: id
   
5. bling_contatos (clientes - 11,654 registros):
   - Colunas: id (bigint), nome (varchar255), situacao (varchar50), telefone (varchar50), 
     celular (varchar50), numeroDocumento (varchar50)
   - Chave: id
   - Relacionamento: id = bling2_pedidos.contato_id

6. bling_fornecedores_produtos (6,416 registros):
   - Colunas: id (bigint), produto_id (bigint), fornecedor_id (bigint)
   - Chave: id
   - Relacionamento: produto_id = bling2_produtos.id

**loja_fisica (PDV - Sistema Físico):**

1. caixas_venda (2,398,331 registros - PRINCIPAL):
   - Colunas: SEQUENCIA (int, PK), BOLETA (varchar13), CODIGO_PRODUTO (varchar9), 
     DESCRICAO (varchar24), QUANTIDADE (float), VALOR_SUBT (decimal19,4), 
     VALOR_CUSTO_SUBT (decimal19,4), VALOR_UNITARIO (decimal19,4), VALOR_DESCONTO (decimal19,4), 
     LOJA (varchar3), CAIXA (varchar3), VENDEDOR (varchar3), OPERADOR (varchar3), 
     DATA (datetime), HORA (varchar2), CODIGO_CLIENTE (varchar6)
   - Chave: SEQUENCIA
   
2. produtos (2,762 registros):
   - Colunas: CODIGO_INTERNO (varchar9, PK), CODIGO_BARRAS (varchar13), DESCRICAO (varchar40), 
     DESCRICAO_RESUMIDA (varchar24), CODIGO_FORNECEDOR (varchar4), UNIDADE (varchar2)
   - Chave: CODIGO_INTERNO
   
3. clientes (5,176 registros):
   - Colunas: CODIGO_CLIENTE (varchar6), NOME (varchar40), RUA (varchar40), BAIRRO (varchar20), 
     CIDADE (varchar20), ESTADO (varchar2), CEP (varchar9), CONTATO (varchar100), 
     CPF_CGC (varchar18), EMAIL (varchar60)

4. estoque (4,242 registros):
   - Colunas: COD_LOCAL (varchar3), CODIGO_INTERNO (varchar9), SALDO_ATUAL (float), 
     CUSTO (decimal19,4), VALOR_VENDA (decimal19,4)
   - Chave: CODIGO_INTERNO, COD_LOCAL

5. fornecedores (44 registros):
   - Colunas: CODIGO_FORNECEDOR (varchar4, PK), NOME (varchar40), CPF_CGC (varchar18), 
     RUA (varchar40), CIDADE (varchar20), ESTADO (varchar2), CONTATO (varchar50)
   - Chave: CODIGO_FORNECEDOR
   - Relacionamento: CODIGO_FORNECEDOR = produtos.CODIGO_FORNECEDOR

6. cancelamentos (176,020 registros):
   - Colunas: DATA (datetime), HORA (varchar8), CODIGO_AUTORIZADOR (varchar3), 
     OPERADOR (varchar3), CAIXA (varchar3), BOLETA (char13), CODIGO_INTERNO (char6), 
     QUANTIDADE (float), VALOR_UNITARIO (float), VALOR_DESCONTO (float), 
     CODIGO_CLIENTE (varchar6), TIPO_CANCELAMENTO (char2), VENDEDOR (varchar3)
   - Uso: Registra vendas/itens cancelados no PDV

7. vw_dprodutos (VIEW - Produtos com imagens):
   - Colunas: CODIGO_INTERNO (varchar13 - SEMPRE 13 dígitos com zeros à esquerda), DESCRICAO (varchar40), img (varchar255 - link da foto do produto)
   - Chave: CODIGO_INTERNO
   - Relacionamento: CODIGO_INTERNO = LPAD(caixas_venda.CODIGO_PRODUTO, 13, '0')
   - ⚠️ IMPORTANTE: CODIGO_PRODUTO em caixas_venda pode ter menos de 13 dígitos (ex: "023380")
   - ⚠️ Use LPAD(cv.CODIGO_PRODUTO, 13, '0') para preencher com zeros à esquerda antes do JOIN
   - Exemplo: "023380" → "0000000023380" (13 dígitos)
   - Uso: Use esta view quando precisar listar produtos COM suas imagens

${forcedSchema ? `\n**IMPORTANTE:** Use APENAS o schema "${forcedSchema}".` : ""}

**ATENÇÃO CRÍTICA:** 
- USE APENAS as colunas listadas acima (case-sensitive!)
- db_gringao: use minúsculas (id, nome, data, contato_id)
- loja_fisica: use MAIÚSCULAS (SEQUENCIA, DATA, VALOR_SUBT, CODIGO_PRODUTO)

REGRAS CRÍTICAS DE SQL (MySQL 5.7):
1. **ONLY_FULL_GROUP_BY:** Todas colunas não-agregadas DEVEM estar no GROUP BY
   - Exemplo: GROUP BY p.codigo, p.nome (não apenas p.id)
2. Use funções de agregação: SUM(), COUNT(), AVG(), MAX(), MIN()
3. 🔴 **EXTRAIA o período da pergunta e use no schema selecionado:**
   - db_gringao: coluna "data" (minúscula) → WHERE data BETWEEN '2025-10-01' AND '2025-10-31'
   - loja_fisica: coluna "DATA" (MAIÚSCULA) → WHERE DATE(DATA) BETWEEN '2025-10-01' AND '2025-10-31'
   - Converta meses para datas: "outubro de 2025" → '2025-10-01' AND '2025-10-31'
   - **NÃO use CURDATE() em db_gringao** (dados históricos)
   - **PODE usar CURDATE() em loja_fisica** para "hoje", "este mês", etc.
4. **USE APENAS COLUNAS QUE EXISTEM** - verifique a lista de colunas disponíveis acima!
5. Sempre use alias: SELECT SUM(valor) AS faturamento
6. SEMPRE prefixe tabelas com o nome do schema: db_gringao.bling2_pedidos ou loja_fisica.caixas_venda
7. **SINTAXE MySQL:** Não use LIMIT com parênteses, use apenas: LIMIT 5
8. **JOINs explícitos:** Sempre use INNER JOIN, LEFT JOIN, etc.
9. **Relacionamentos corretos:**
   - bling2_detalhes_pedidos.codigo = bling2_produtos.codigo (para nome do produto)
   - bling2_detalhes_pedidos.id = bling2_pedidos.id (para dados do pedido)
   - ⚠️ loja_fisica.vw_dprodutos.CODIGO_INTERNO = LPAD(caixas_venda.CODIGO_PRODUTO, 13, '0') (para imagens dos produtos)
   - ⚠️ IMPORTANTE: Use LPAD para preencher CODIGO_PRODUTO com zeros à esquerda até 13 dígitos antes do JOIN
10. **Ao listar produtos:**
    - **db_gringao:** SEMPRE inclua p.codigo, p.nome, p.imagemURL no SELECT e no GROUP BY
    - **loja_fisica:** SEMPRE inclua vw.CODIGO_INTERNO, vw.DESCRICAO, vw.img no SELECT e no GROUP BY
    - ⚠️ **CRÍTICO para loja_fisica:** Use LPAD para preencher CODIGO_PRODUTO com zeros à esquerda até 13 dígitos
    - JOIN correto: INNER JOIN loja_fisica.vw_dprodutos vw ON vw.CODIGO_INTERNO = LPAD(cv.CODIGO_PRODUTO, 13, '0')
    - Exemplo: CODIGO_PRODUTO "023380" → LPAD resulta em "0000000023380" (13 dígitos)
    - Isso permite mostrar as imagens dos produtos na interface

11. **🔴 REGRA CRÍTICA - FOTOS DE PRODUTOS (loja_fisica):**
    - **SEMPRE que o usuário pedir "foto", "imagem", "photo", "image" de produto da loja física:**
      * OBRIGATÓRIO usar loja_fisica.vw_dprodutos com JOIN usando LPAD
      * OBRIGATÓRIO incluir vw.img no SELECT
      * OBRIGATÓRIO incluir vw.img no GROUP BY
    - Palavras-chave que acionam esta regra: "foto", "imagem", "photo", "image", "mostre a foto", "com foto", "com imagem"
    - Exemplo de pergunta: "mostre o produto 023380 com a foto" → DEVE usar vw_dprodutos e incluir vw.img

EXEMPLOS CORRETOS (db_gringao):
Nota: O usuário seleciona "E-commerce" na sidebar

Pergunta: "Faturamento total" (sem período específico)
SQL: SELECT SUM(receita) AS faturamento FROM db_gringao.vw_revenue
Schema: db_gringao
Nota: Use vw_revenue para análises de receita/custo/lucro

Pergunta: "Faturamento em janeiro de 2025"
SQL: SELECT SUM(receita) AS faturamento FROM db_gringao.vw_revenue WHERE data BETWEEN '2025-01-01' AND '2025-01-31'
Schema: db_gringao
Nota: Use vw_revenue para análises de receita (tem dados desde 2023)

Pergunta: "Qual foi a quantidade de produtos vendidos no mes de outubro de 2025?"
SQL: SELECT SUM(dp.quantidade) AS total_produtos FROM db_gringao.bling2_detalhes_pedidos dp WHERE dp.data BETWEEN '2025-10-01' AND '2025-10-31'
Schema: db_gringao
Nota: Extrai "outubro de 2025" e converte para datas SQL

Pergunta: "Top 5 produtos mais vendidos em dezembro de 2024"
SQL: SELECT p.codigo, p.nome, p.imagemURL, SUM(dp.quantidade) AS total_vendido FROM db_gringao.bling2_detalhes_pedidos dp INNER JOIN db_gringao.bling2_produtos p ON dp.codigo = p.codigo WHERE dp.data BETWEEN '2024-12-01' AND '2024-12-31' GROUP BY p.codigo, p.nome, p.imagemURL ORDER BY total_vendido DESC LIMIT 5
Schema: db_gringao
Nota: Sempre inclua p.imagemURL quando listar produtos

Pergunta: "Melhor cliente"
SQL: SELECT c.nome, COUNT(p.id) AS total_pedidos, SUM(p.total) AS valor_total FROM db_gringao.bling_contatos c INNER JOIN db_gringao.bling2_pedidos p ON c.id = p.contato_id GROUP BY c.id, c.nome ORDER BY valor_total DESC LIMIT 1
Schema: db_gringao

EXEMPLOS CORRETOS (loja_fisica):
Nota: O usuário seleciona "Loja Física" na sidebar

Pergunta: "Faturamento total de hoje"
SQL: SELECT SUM(VALOR_SUBT - VALOR_DESCONTO) AS faturamento FROM loja_fisica.caixas_venda WHERE DATE(DATA) = CURDATE()
Schema: loja_fisica

Pergunta: "Qual foi a quantidade de produtos vendidos no mes de outubro de 2025?"
SQL: SELECT SUM(QUANTIDADE) AS total_produtos FROM loja_fisica.caixas_venda WHERE DATE(DATA) BETWEEN '2025-10-01' AND '2025-10-31'
Schema: loja_fisica
Nota: Extrai "outubro de 2025" e converte para datas SQL

Pergunta: "Crie um gráfico com todos os meses desse ano" (IMPORTANTE!)
SQL: SELECT MONTH(DATA) AS mes, SUM(VALOR_SUBT - VALOR_DESCONTO) AS faturamento FROM loja_fisica.caixas_venda WHERE YEAR(DATA) = 2025 GROUP BY MONTH(DATA) ORDER BY mes
Schema: loja_fisica
visualizationType: "chart"
chartType: "line"
Nota: NÃO filtra por mês específico - busca TODOS os meses de 2025!

Pergunta: "Mostre o faturamento mensal de 2025"
SQL: SELECT MONTH(DATA) AS mes, SUM(VALOR_SUBT - VALOR_DESCONTO) AS faturamento FROM loja_fisica.caixas_venda WHERE YEAR(DATA) = 2025 GROUP BY MONTH(DATA) ORDER BY mes
Schema: loja_fisica
visualizationType: "chart"
chartType: "bar"
Nota: Busca TODOS os meses, não apenas um!

Pergunta: "Produtos mais vendidos em outubro de 2025"
SQL: SELECT vw.CODIGO_INTERNO, vw.DESCRICAO, vw.img, SUM(cv.QUANTIDADE) AS total FROM loja_fisica.caixas_venda cv INNER JOIN loja_fisica.vw_dprodutos vw ON vw.CODIGO_INTERNO = LPAD(cv.CODIGO_PRODUTO, 13, '0') WHERE DATE(cv.DATA) BETWEEN '2025-10-01' AND '2025-10-31' GROUP BY vw.CODIGO_INTERNO, vw.DESCRICAO, vw.img ORDER BY total DESC LIMIT 10
Schema: loja_fisica
Nota: ⚠️ Use LPAD(cv.CODIGO_PRODUTO, 13, '0') no JOIN para preencher com zeros à esquerda. Sempre inclua vw.img quando listar produtos da loja física para mostrar imagens

Pergunta: "Produtos mais vendidos" (sem período)
SQL: SELECT vw.CODIGO_INTERNO, vw.DESCRICAO, vw.img, SUM(cv.QUANTIDADE) AS total FROM loja_fisica.caixas_venda cv INNER JOIN loja_fisica.vw_dprodutos vw ON vw.CODIGO_INTERNO = LPAD(cv.CODIGO_PRODUTO, 13, '0') GROUP BY vw.CODIGO_INTERNO, vw.DESCRICAO, vw.img ORDER BY total DESC LIMIT 10
Schema: loja_fisica
Nota: ⚠️ Use LPAD(cv.CODIGO_PRODUTO, 13, '0') no JOIN para preencher com zeros à esquerda. Sempre inclua vw.img quando listar produtos da loja física para mostrar imagens

Pergunta: "Mostre o produto 023380 com a foto"
SQL: SELECT vw.CODIGO_INTERNO, vw.DESCRICAO, vw.img, SUM(cv.QUANTIDADE) AS total_vendido, SUM(cv.VALOR_SUBT - cv.VALOR_DESCONTO) AS faturamento FROM loja_fisica.caixas_venda cv INNER JOIN loja_fisica.vw_dprodutos vw ON vw.CODIGO_INTERNO = LPAD(cv.CODIGO_PRODUTO, 13, '0') WHERE cv.CODIGO_PRODUTO = '023380' GROUP BY vw.CODIGO_INTERNO, vw.DESCRICAO, vw.img
Schema: loja_fisica
Nota: ⚠️ Quando pedir foto, OBRIGATÓRIO usar vw_dprodutos com LPAD e incluir vw.img no SELECT e GROUP BY

Pergunta: "Análise do produto 023380 e mostre a foto"
SQL: SELECT vw.CODIGO_INTERNO, vw.DESCRICAO, vw.img, SUM(cv.QUANTIDADE) AS total_vendido, SUM(cv.VALOR_SUBT - cv.VALOR_DESCONTO) AS faturamento, COUNT(DISTINCT cv.BOLETA) AS total_vendas, AVG(cv.VALOR_SUBT - cv.VALOR_DESCONTO) AS ticket_medio FROM loja_fisica.caixas_venda cv INNER JOIN loja_fisica.vw_dprodutos vw ON vw.CODIGO_INTERNO = LPAD(cv.CODIGO_PRODUTO, 13, '0') WHERE cv.CODIGO_PRODUTO = '023380' GROUP BY vw.CODIGO_INTERNO, vw.DESCRICAO, vw.img
Schema: loja_fisica
Nota: ⚠️ Quando pedir foto/imagem, SEMPRE usar vw_dprodutos com LPAD e incluir vw.img

Pergunta: "Vendas deste mês"
SQL: SELECT SUM(QUANTIDADE) AS total FROM loja_fisica.caixas_venda WHERE YEAR(DATA) = YEAR(CURDATE()) AND MONTH(DATA) = MONTH(CURDATE())
Schema: loja_fisica

Pergunta: "Quantos fornecedores temos?"
SQL: SELECT COUNT(*) AS total FROM loja_fisica.fornecedores
Schema: loja_fisica

Pergunta: "Cancelamentos de hoje"
SQL: SELECT COUNT(*) AS total FROM loja_fisica.cancelamentos WHERE DATE(DATA) = CURDATE()
Schema: loja_fisica

**EXEMPLOS DE MÉTRICAS ESPECÍFICAS (loja_fisica):**
 
 Pergunta: "Qual o ticket médio de outubro de 2025?"
 SQL: SELECT AVG(valor_venda) AS ticket_medio FROM (SELECT BOLETA, SUM(VALOR_SUBT - VALOR_DESCONTO) AS valor_venda FROM loja_fisica.caixas_venda WHERE DATE(DATA) BETWEEN '2025-10-01' AND '2025-10-31' GROUP BY BOLETA) AS subquery
 Schema: loja_fisica
 Nota: Ticket Médio = Média do valor total por venda (boleta)
 
 Pergunta: "Ranking de vendedores em outubro"
 SQL: SELECT VENDEDOR, SUM(VALOR_SUBT - VALOR_DESCONTO) AS total_vendas, COUNT(DISTINCT BOLETA) AS qtd_vendas FROM loja_fisica.caixas_venda WHERE DATE(DATA) BETWEEN '2025-10-01' AND '2025-10-31' GROUP BY VENDEDOR ORDER BY total_vendas DESC
 Schema: loja_fisica
 Nota: Agrupa por código do vendedor
 
 Pergunta: "Quantidade de produtos vendidos em outubro de 2025"
 SQL: SELECT SUM(QUANTIDADE) AS total_produtos FROM loja_fisica.caixas_venda WHERE DATE(DATA) BETWEEN '2025-10-01' AND '2025-10-31'
 Schema: loja_fisica
 Nota: Soma total de produtos (quantidade) vendidos no período
 
 Pergunta: "Quantidade de clientes que compraram em outubro de 2025"
 SQL: SELECT COUNT(DISTINCT CODIGO_CLIENTE) AS total_clientes FROM loja_fisica.caixas_venda WHERE DATE(DATA) BETWEEN '2025-10-01' AND '2025-10-31' AND CODIGO_CLIENTE IS NOT NULL AND CODIGO_CLIENTE != ''
 Schema: loja_fisica
 Nota: Conta clientes únicos (DISTINCT) que fizeram compras
 
 Pergunta: "Quantidade vendida por atendimento em outubro de 2025"
 SQL: SELECT AVG(qtd_por_boleta) AS media_por_atendimento FROM (SELECT BOLETA, SUM(QUANTIDADE) AS qtd_por_boleta FROM loja_fisica.caixas_venda WHERE DATE(DATA) BETWEEN '2025-10-01' AND '2025-10-31' GROUP BY BOLETA) AS subquery
 Schema: loja_fisica
 Nota: Média de produtos por boleta (atendimento/venda)
 
 Pergunta: "Valor total de compras em outubro de 2025"
 SQL: SELECT SUM(VALOR_SUBT) AS total_compras FROM loja_fisica.caixas_venda WHERE DATE(DATA) BETWEEN '2025-10-01' AND '2025-10-31'
 Schema: loja_fisica
 Nota: Soma do valor subtotal (antes de descontos)
 
 Pergunta: "Valor total de custo em outubro de 2025"
 SQL: SELECT SUM(VALOR_CUSTO_SUBT) AS total_custo FROM loja_fisica.caixas_venda WHERE DATE(DATA) BETWEEN '2025-10-01' AND '2025-10-31'
 Schema: loja_fisica
 Nota: Soma do custo total dos produtos vendidos
 
 Pergunta: "Valor total de vendas em outubro de 2025"
 SQL: SELECT SUM(VALOR_SUBT - VALOR_DESCONTO) AS total_vendas FROM loja_fisica.caixas_venda WHERE DATE(DATA) BETWEEN '2025-10-01' AND '2025-10-31'
 Schema: loja_fisica
 Nota: Valor líquido de vendas (subtotal menos descontos)
 
 Pergunta: "Quantidade de produtos vendidos em 15 de março de 2024"
 SQL: SELECT SUM(QUANTIDADE) AS total_produtos FROM loja_fisica.caixas_venda WHERE DATE(DATA) = '2024-03-15'
 Schema: loja_fisica
 Nota: Funciona para qualquer data específica
 
 Pergunta: "Clientes que compraram em dezembro de 2023"
 SQL: SELECT COUNT(DISTINCT CODIGO_CLIENTE) AS total_clientes FROM loja_fisica.caixas_venda WHERE DATE(DATA) BETWEEN '2023-12-01' AND '2023-12-31' AND CODIGO_CLIENTE IS NOT NULL AND CODIGO_CLIENTE != ''
 Schema: loja_fisica
 Nota: Funciona para qualquer mês/ano
 
 Pergunta: "Valor de vendas no primeiro semestre de 2025"
 SQL: SELECT SUM(VALOR_SUBT - VALOR_DESCONTO) AS total_vendas FROM loja_fisica.caixas_venda WHERE DATE(DATA) BETWEEN '2025-01-01' AND '2025-06-30'
 Schema: loja_fisica
 Nota: Primeiro semestre = janeiro a junho
 
 Pergunta: "Quantos clientes compraram em novembro"
 SQL: SELECT COUNT(DISTINCT CODIGO_CLIENTE) AS total_clientes FROM loja_fisica.caixas_venda WHERE YEAR(DATA) = YEAR(CURDATE()) AND MONTH(DATA) = 11 AND CODIGO_CLIENTE IS NOT NULL AND CODIGO_CLIENTE != ''
 Schema: loja_fisica
 Nota: Sem ano especificado = ano atual
 
 Pergunta: "Média de produtos por venda em 2024"
 SQL: SELECT AVG(qtd_por_boleta) AS media_por_atendimento FROM (SELECT BOLETA, SUM(QUANTIDADE) AS qtd_por_boleta FROM loja_fisica.caixas_venda WHERE YEAR(DATA) = 2024 GROUP BY BOLETA) AS subquery
 Schema: loja_fisica
 Nota: Ano inteiro = YEAR(DATA) = 2024
 
 Pergunta: "Faturamento de ontem"
 SQL: SELECT SUM(VALOR_SUBT - VALOR_DESCONTO) AS total_vendas FROM loja_fisica.caixas_venda WHERE DATE(DATA) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
 Schema: loja_fisica
 Nota: Ontem = CURDATE() - 1 dia
 
 Pergunta: "Custo total da última semana"
 SQL: SELECT SUM(VALOR_CUSTO_SUBT) AS total_custo FROM loja_fisica.caixas_venda WHERE DATE(DATA) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
 Schema: loja_fisica
 Nota: Última semana = últimos 7 dias
 
**EXEMPLOS DE COMPARAÇÕES ENTRE PERÍODOS:**

Pergunta: "Compare o mes de agosto desse ano com o do ano passado"
SQL: SELECT 
  YEAR(data) AS ano,
  MONTH(data) AS mes,
  SUM(receita) AS faturamento,
  SUM(transacoes) AS total_pedidos
FROM db_gringao.vw_revenue
WHERE (data BETWEEN '2024-08-01' AND '2024-08-31') OR (data BETWEEN '2025-08-01' AND '2025-08-31')
GROUP BY YEAR(data), MONTH(data)
ORDER BY ano, mes
Schema: db_gringao
Nota: Use vw_revenue para análises de receita. Use a DATA ATUAL para determinar "desse ano" e "ano passado". Se estamos em 2025, "desse ano" = 2025 e "ano passado" = 2024

Pergunta: "Comparar vendas de janeiro e fevereiro de 2025"
SQL: SELECT 
  MONTH(dp.data) AS mes,
  SUM(dp.quantidade) AS total_produtos,
  SUM(dp.valor) AS faturamento
FROM db_gringao.bling2_detalhes_pedidos dp
WHERE dp.data BETWEEN '2025-01-01' AND '2025-02-29'
GROUP BY MONTH(dp.data)
ORDER BY mes
Schema: db_gringao

Pergunta: "Faturamento de outubro de 2024 vs outubro de 2025"
SQL: SELECT 
  YEAR(DATA) AS ano,
  SUM(VALOR_SUBT - VALOR_DESCONTO) AS faturamento
FROM loja_fisica.caixas_venda
WHERE (DATE(DATA) BETWEEN '2024-10-01' AND '2024-10-31') OR (DATE(DATA) BETWEEN '2025-10-01' AND '2025-10-31')
GROUP BY YEAR(DATA)
ORDER BY ano
Schema: loja_fisica

**FORMATO DE RESPOSTA OBRIGATÓRIO:**

Para perguntas NORMAIS (sem comparação entre períodos):
{
  "sqlQuery": "SELECT ...",
  "explanation": "Breve explicação",
  "visualizationType": "card",
  "schema": "db_gringao",
  "confidence": 95,
  "isComparison": false
}

Para perguntas de COMPARAÇÃO entre períodos (ex: "compare agosto com setembro", "vendas de 2024 vs 2025"):
{
  "sqlQuery": "",
  "explanation": "Comparação entre períodos",
  "visualizationType": "table",
  "schema": "db_gringao",
  "confidence": 95,
  "isComparison": true,
  "comparisonQueries": [
    {
      "label": "Agosto de 2024",
      "period": "2024-08",
      "sqlQuery": "SELECT SUM(total) AS faturamento FROM db_gringao.bling2_pedidos WHERE data BETWEEN '2024-08-01' AND '2024-08-31'"
    },
    {
      "label": "Agosto de 2025",
      "period": "2025-08",
      "sqlQuery": "SELECT SUM(total) AS faturamento FROM db_gringao.bling2_pedidos WHERE data BETWEEN '2025-08-01' AND '2025-08-31'"
    }
  ]
}

Para perguntas que PEDEM GRÁFICO explicitamente (ex: "crie um gráfico com vendas por mês", "mostre em gráfico"):
{
  "sqlQuery": "SELECT DATE_FORMAT(DATA, '%Y-%m') AS mes, SUM(VALOR_SUBT - VALOR_DESCONTO) AS faturamento FROM loja_fisica.caixas_venda WHERE YEAR(DATA) = 2025 GROUP BY DATE_FORMAT(DATA, '%Y-%m') ORDER BY mes",
  "explanation": "Faturamento mensal de 2025",
  "visualizationType": "chart",
  "chartType": "line",
  "schema": "loja_fisica",
  "confidence": 95,
  "isComparison": false
}

**IMPORTANTE SOBRE GRÁFICOS MENSAIS/ANUAIS:**
- Quando o usuário pedir "todos os meses", "o ano todo", "meses desse ano", "mensal":
  * Use GROUP BY com DATE_FORMAT(DATA, '%Y-%m') ou MONTH(DATA)
  * NÃO limite a apenas um mês - busque TODOS os meses do período
  * Para loja_fisica: WHERE YEAR(DATA) = 2025 (sem filtro de mês específico)
  * Para db_gringao: WHERE YEAR(data) = 2025 (sem filtro de mês específico)
  * Use chartType: "line" para séries temporais (evolução ao longo do tempo)
  * Use chartType: "bar" para comparações entre meses
- Exemplo CORRETO para "todos os meses de 2025":
  * SELECT MONTH(DATA) as mes, SUM(VALOR_SUBT - VALOR_DESCONTO) as faturamento FROM loja_fisica.caixas_venda WHERE YEAR(DATA) = 2025 GROUP BY MONTH(DATA) ORDER BY mes
- Exemplo ERRADO: WHERE DATA BETWEEN '2025-01-01' AND '2025-01-31' (só janeiro!)
- Exemplo CERTO: WHERE YEAR(DATA) = 2025 (todos os meses!)

Para COMPARAÇÃO com GRÁFICO (ex: "crie um gráfico comparando agosto e setembro"):
{
  "sqlQuery": "",
  "explanation": "Comparação gráfica entre períodos",
  "visualizationType": "chart",
  "chartType": "bar",
  "schema": "loja_fisica",
  "confidence": 95,
  "isComparison": true,
  "comparisonQueries": [
    {
      "label": "Agosto de 2025",
      "period": "2025-08",
      "sqlQuery": "SELECT SUM(VALOR_SUBT - VALOR_DESCONTO) AS faturamento, SUM(QUANTIDADE) AS quantidade FROM loja_fisica.caixas_venda WHERE DATE(DATA) BETWEEN '2025-08-01' AND '2025-08-31'"
    },
    {
      "label": "Setembro de 2025",
      "period": "2025-09",
      "sqlQuery": "SELECT SUM(VALOR_SUBT - VALOR_DESCONTO) AS faturamento, SUM(QUANTIDADE) AS quantidade FROM loja_fisica.caixas_venda WHERE DATE(DATA) BETWEEN '2025-09-01' AND '2025-09-30'"
    }
  ]
}

**IMPORTANTE SOBRE COMPARAÇÕES:**
- Detecte palavras-chave: "compare", "comparar", "vs", "versus", "diferença entre", "x vs y"
- Gere uma query SEPARADA para cada período sendo comparado
- Cada query deve buscar as MESMAS métricas (mesmas colunas no SELECT)
- Use labels descritivos para cada período
- O campo "sqlQuery" principal fica vazio quando isComparison = true

**DETECÇÃO DE TIPO DE VISUALIZAÇÃO:**
- Se o usuário pedir explicitamente "gráfico", "grafico", "chart", "visualização", "mostre graficamente":
  * Use visualizationType: "chart"
  * Escolha o chartType apropriado: "bar" (padrão para comparações), "line" (séries temporais), "pie" (distribuições)
- Se for comparação entre períodos E o usuário pedir gráfico:
  * Use visualizationType: "chart" e chartType: "bar"
- Palavras-chave para gráfico: "crie um gráfico", "mostre em gráfico", "gráfico com", "visualize", "plote"

**REGRAS FINAIS:**
- Retorne APENAS o JSON, sem explicações adicionais
- O SQL deve ser válido para MySQL 5.7
- explanation: máximo 100 caracteres
- NÃO adicione texto antes ou depois do JSON
- NÃO use markdown code blocks`;
}

