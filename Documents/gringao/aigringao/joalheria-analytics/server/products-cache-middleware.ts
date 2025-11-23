import { executeExternalQuery } from "./external-db";
import { setCache, getCache } from "./redis-cache";

/**
 * Cache Middleware específico para produtos
 * Pré-carrega produtos mais vendidos para melhor performance
 */

interface ProductCacheConfig {
  schema: "db_gringao" | "loja_fisica";
  limit: number;
  offset: number;
  search?: string;
}

/**
 * Pré-carrega produtos mais vendidos (top 1000) para cache
 */
export async function preloadTopProducts(schema: "db_gringao" | "loja_fisica") {
  console.log(`\n🔄 [Products Cache] Pré-carregando top produtos para ${schema}...\n`);

  try {
    let query = "";

    if (schema === "loja_fisica") {
      query = `
        SELECT 
          vw.CODIGO_INTERNO as codigo_produto,
          vw.img as imagem,
          vw.DESCRICAO as nome_descricao,
          COALESCE(SUM(cv.QUANTIDADE), 0) as quantidade_vendida,
          COALESCE(MAX(e.SALDO_ATUAL), 0) as estoque,
          COALESCE(
            CASE 
              WHEN DATEDIFF(MAX(cv.DATA), MIN(cv.DATA)) > 0 
              THEN SUM(cv.QUANTIDADE) / DATEDIFF(MAX(cv.DATA), MIN(cv.DATA))
              ELSE 0 
            END, 
            0
          ) as media_diaria_vendas,
          COALESCE(MAX(e.SALDO_ATUAL), 0) as estoque_minimo,
          COALESCE(MAX(e.CUSTO), 0) as custo,
          COALESCE(MAX(f.NOME), 'Sem fornecedor') as fornecedor
        FROM loja_fisica.vw_dprodutos vw
        LEFT JOIN loja_fisica.caixas_venda cv ON vw.CODIGO_INTERNO = LPAD(cv.CODIGO_PRODUTO, 13, '0')
        LEFT JOIN loja_fisica.estoque e ON vw.CODIGO_INTERNO = LPAD(e.CODIGO_INTERNO, 13, '0')
        LEFT JOIN loja_fisica.produtos p ON vw.CODIGO_INTERNO = LPAD(p.CODIGO_INTERNO, 13, '0')
        LEFT JOIN loja_fisica.fornecedores f ON p.CODIGO_FORNECEDOR = f.CODIGO_FORNECEDOR
        GROUP BY 
          vw.CODIGO_INTERNO, 
          vw.img, 
          vw.DESCRICAO
        ORDER BY quantidade_vendida DESC
        LIMIT 1000
      `;
    } else {
      query = `
        SELECT 
          p.codigo as codigo_produto,
          p.imagemURL as imagem,
          p.nome as nome_descricao,
          COALESCE(SUM(dp.quantidade), 0) as quantidade_vendida,
          COALESCE(p.estoque, 0) as estoque,
          COALESCE(
            CASE 
              WHEN DATEDIFF(MAX(dp.data), MIN(dp.data)) > 0 
              THEN SUM(dp.quantidade) / DATEDIFF(MAX(dp.data), MIN(dp.data))
              ELSE 0 
            END, 
            0
          ) as media_diaria_vendas,
          COALESCE(p.estoque, 0) as estoque_minimo,
          COALESCE(p.precoCusto, 0) as custo,
          COALESCE(GROUP_CONCAT(DISTINCT f.nome SEPARATOR ', '), 'Sem fornecedor') as fornecedor
        FROM db_gringao.bling2_produtos p
        LEFT JOIN db_gringao.bling2_detalhes_pedidos dp ON p.codigo = dp.codigo
        LEFT JOIN db_gringao.bling_fornecedores_produtos fp ON p.id = fp.produto_id
        LEFT JOIN db_gringao.bling_contatos f ON fp.fornecedor_id = f.id AND f.situacao = 'fornecedor'
        GROUP BY 
          p.codigo, 
          p.imagemURL, 
          p.nome, 
          p.estoque, 
          p.precoCusto
        ORDER BY quantidade_vendida DESC
        LIMIT 1000
      `;
    }

    const startTime = Date.now();
    const data = await executeExternalQuery(query, schema);
    const executionTime = Date.now() - startTime;

    // Salva no cache em chunks de 100 produtos
    const chunkSize = 100;
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    const cachePromises = chunks.map(async (chunk, index) => {
      const offset = index * chunkSize;
      const cacheKey = `products:${schema}:limit:100:offset:${offset}`;
      const cacheTTL = schema === 'db_gringao' ? 7200 : 1800;
      await setCache(cacheKey, schema, chunk, cacheTTL);
    });

    await Promise.all(cachePromises);

    console.log(`✅ [Products Cache] ${data.length} produtos pré-carregados em ${executionTime}ms`);
    console.log(`✅ [Products Cache] ${chunks.length} chunks salvos no cache\n`);

    return { success: true, count: data.length, chunks: chunks.length, executionTime };
  } catch (error: any) {
    console.error(`❌ [Products Cache] Erro ao pré-carregar produtos:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Pré-carrega produtos para ambos os schemas
 */
export async function preloadAllProducts() {
  console.log("\n🚀 [Products Cache] Iniciando pré-carregamento de produtos...\n");

  const results = await Promise.allSettled([
    preloadTopProducts("loja_fisica"),
    preloadTopProducts("db_gringao"),
  ]);

  const summary = {
    loja_fisica: results[0].status === "fulfilled" ? results[0].value : { success: false },
    db_gringao: results[1].status === "fulfilled" ? results[1].value : { success: false },
  };

  console.log("\n📊 [Products Cache] Resumo do pré-carregamento:");
  console.log(`  - Loja Física: ${summary.loja_fisica.success ? "✅" : "❌"}`);
  console.log(`  - E-commerce: ${summary.db_gringao.success ? "✅" : "❌"}\n`);

  return summary;
}

