import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./trpc";
import { analyzeQuestion } from "./llm-query-analyzer";
import { validateAndFixSQL } from "./sql-validator";
import { executeExternalQuery, getAvailablePeriods } from "./external-db";
import { generateNaturalResponse } from "./llm-response-generator";
import {
  saveChatHistory,
  getCachedQuery,
  saveCachedQuery,
  saveQueryMetrics,
  getChatHistory,
  deleteCachedQuery,
  deleteCacheBySchema,
} from "./db";
import { getCache, setCache, deleteCache } from "./redis-cache";
import { v4 as uuidv4 } from "uuid";
import { exportToTXT, exportToExcel, exportDashboardToExcel, generateFilename } from "./export-utils";

export const analyticsRouter = router({
  // Buscar dados do dashboard por período
  getDashboardData: protectedProcedure
    .input(
      z.object({
        schema: z.enum(["db_gringao", "loja_fisica"]),
        period: z.enum(["daily", "weekly", "monthly", "yearly"]),
      })
    )
    .query(async ({ input }) => {
      const { schema, period } = input;
      const startTime = Date.now();

      try {
        // Gera chave de cache única para este dashboard
        const cacheKey = `dashboard:${schema}:${period}`;

        // Se forceRefresh, limpa o cache antes de buscar
        if (forceRefresh) {
          await deleteCache(cacheKey, schema);
          console.log(`[Dashboard] 🗑️ Cache cleared for ${cacheKey} (forceRefresh=true)`);
        }

        // Verifica cache primeiro (Redis, depois SQLite fallback)
        if (!forceRefresh) {
          const cached = await getCache(cacheKey, schema);
          if (cached) {
            console.log(`[Dashboard] ✅ Cache hit for ${cacheKey}`);
            return {
              success: true,
              cached: true,
              data: cached,
              period,
              schema,
              executionTime: Date.now() - startTime,
            };
          }
        }

        console.log(`[Dashboard] ${forceRefresh ? 'Force refresh' : 'Cache miss'} for ${cacheKey}, fetching from DB...`);

        // Busca períodos disponíveis para usar o mais recente
        const availablePeriods = await getAvailablePeriods(schema);
        const latestPeriod = availablePeriods.length > 0 ? availablePeriods[0] : null;
        const latestYear = latestPeriod?.year || new Date().getFullYear();
        const latestMonth = latestPeriod?.month || new Date().getMonth() + 1;

        console.log(`[Dashboard] Available periods for ${schema}:`, availablePeriods);
        console.log(`[Dashboard] Using latest period: ${latestYear}-${latestMonth} for ${schema}`);

        let query = "";

        // Define queries baseadas no período e schema
        if (schema === "loja_fisica") {
          switch (period) {
            case "daily":
              // Dias do mês mais recente com dados
              query = `
                SELECT 
                  DAY(DATA) as dia,
                  DATE_FORMAT(DATA, '%d/%m') as data_formatada,
                  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
                  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
                  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro,
                  COUNT(DISTINCT BOLETA) as transacoes
                FROM loja_fisica.caixas_venda
                WHERE YEAR(DATA) = ${latestYear} 
                  AND MONTH(DATA) = ${latestMonth}
                GROUP BY DAY(DATA), DATE_FORMAT(DATA, '%d/%m')
                ORDER BY DAY(DATA)
              `;
              break;

            case "weekly":
              // Semanas do ano mais recente com dados
              query = `
                SELECT 
                  WEEK(DATA, 1) as semana_numero,
                  CONCAT('Sem ', WEEK(DATA, 1)) as semana,
                  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
                  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
                  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro,
                  COUNT(DISTINCT BOLETA) as transacoes
                FROM loja_fisica.caixas_venda
                WHERE YEAR(DATA) = ${latestYear}
                GROUP BY WEEK(DATA, 1)
                ORDER BY WEEK(DATA, 1)
              `;
              break;

            case "monthly":
              // Meses do ano mais recente com dados
              query = `
                SELECT 
                  MONTH(DATA) as mes_numero,
                  DATE_FORMAT(DATA, '%b') as mes,
                  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
                  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
                  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro,
                  COUNT(DISTINCT BOLETA) as transacoes
                FROM loja_fisica.caixas_venda
                WHERE YEAR(DATA) = ${latestYear}
                GROUP BY MONTH(DATA), DATE_FORMAT(DATA, '%b')
                ORDER BY MONTH(DATA)
              `;
              break;

            case "yearly":
              // Busca TODOS os anos disponíveis (não apenas os últimos 12 meses)
              query = `
                SELECT 
                  YEAR(DATA) as ano,
                  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
                  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
                  SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro,
                  COUNT(DISTINCT BOLETA) as transacoes
                FROM loja_fisica.caixas_venda
                WHERE DATA IS NOT NULL
                GROUP BY YEAR(DATA)
                ORDER BY YEAR(DATA)
              `;
              break;
          }
        } else {
          // db_gringao (e-commerce) - Usa view vw_revenue que tem dados desde 2023
          switch (period) {
            case "daily":
              // Dias do mês mais recente com dados
              query = `
                SELECT 
                  DAY(data) as dia,
                  DATE_FORMAT(data, '%d/%m') as data_formatada,
                  SUM(receita) as receita,
                  SUM(custo) as custo,
                  SUM(lucro) as lucro,
                  SUM(transacoes) as transacoes
                FROM db_gringao.vw_revenue
                WHERE YEAR(data) = ${latestYear} 
                  AND MONTH(data) = ${latestMonth}
                GROUP BY DAY(data), DATE_FORMAT(data, '%d/%m')
                ORDER BY DAY(data)
              `;
              break;

            case "weekly":
              // Semanas do ano mais recente com dados
              query = `
                SELECT 
                  WEEK(data, 1) as semana_numero,
                  CONCAT('Sem ', WEEK(data, 1)) as semana,
                  SUM(receita) as receita,
                  SUM(custo) as custo,
                  SUM(lucro) as lucro,
                  SUM(transacoes) as transacoes
                FROM db_gringao.vw_revenue
                WHERE YEAR(data) = ${latestYear}
                GROUP BY WEEK(data, 1)
                ORDER BY WEEK(data, 1)
              `;
              break;

            case "monthly":
              // Meses do ano mais recente com dados
              query = `
                SELECT 
                  MONTH(data) as mes_numero,
                  DATE_FORMAT(data, '%b') as mes,
                  SUM(receita) as receita,
                  SUM(custo) as custo,
                  SUM(lucro) as lucro,
                  SUM(transacoes) as transacoes
                FROM db_gringao.vw_revenue
                WHERE YEAR(data) = ${latestYear}
                GROUP BY MONTH(data), DATE_FORMAT(data, '%b')
                ORDER BY MONTH(data)
              `;
              break;

            case "yearly":
              // Busca TODOS os anos disponíveis na view (desde 2023)
              query = `
                SELECT 
                  YEAR(data) as ano,
                  SUM(receita) as receita,
                  SUM(custo) as custo,
                  SUM(lucro) as lucro,
                  SUM(transacoes) as transacoes
                FROM db_gringao.vw_revenue
                WHERE data IS NOT NULL
                GROUP BY YEAR(data)
                ORDER BY YEAR(data)
              `;
              break;
          }
        }

        console.log(`[Dashboard] Executing query for ${schema} - ${period}:`);
        console.log(`[Dashboard] SQL:`, query);

        const data = await executeExternalQuery(query, schema);

        console.log(`[Dashboard] Query returned ${data.length} rows`);
        if (data.length > 0) {
          console.log(`[Dashboard] First row sample:`, JSON.stringify(data[0]));
        }

        // Salva no cache (Redis e SQLite)
        const ttlSeconds = schema === 'db_gringao' ? 7200 : 1800; // 2h ou 30min
        await setCache(cacheKey, schema, data, ttlSeconds);

        console.log(`[Dashboard] 💾 Cached ${cacheKey} (${data.length} rows)`);

        // Salva métricas
        await saveQueryMetrics({
          schema,
          executionTime: Date.now() - startTime,
          success: true,
          cached: false,
        });

        return {
          success: true,
          cached: false,
          data,
          period,
          schema,
          executionTime: Date.now() - startTime,
        };
      } catch (error: any) {
        console.error("[Dashboard] Error fetching data:", error);

        // Salva métricas de erro
        await saveQueryMetrics({
          schema,
          executionTime: Date.now() - startTime,
          success: false,
          cached: false,
        });

        return {
          success: false,
          error: error.message,
          data: [],
        };
      }
    }),

  // Buscar dados de comparação com ano anterior
  getComparisonData: protectedProcedure
    .input(
      z.object({
        schema: z.enum(["db_gringao", "loja_fisica"]),
        period: z.enum(["daily", "weekly", "monthly", "yearly"]),
      })
    )
    .query(async ({ input }) => {
      const { schema, period } = input;
      const startTime = Date.now();

      try {
        // Gera chave de cache única para comparação
        const cacheKey = `comparison:${schema}:${period}`;

        // Verifica cache primeiro (Redis, depois SQLite fallback)
        const cached = await getCache(cacheKey, schema);
        if (cached) {
          console.log(`[Comparison] ✅ Cache hit for ${cacheKey}`);
          return {
            success: true,
            cached: true,
            data: cached,
            period,
            schema,
            executionTime: Date.now() - startTime,
          };
        }

        console.log(`[Comparison] Cache miss for ${cacheKey}, fetching from DB...`);

        // Busca períodos disponíveis para usar o mais recente
        const availablePeriods = await getAvailablePeriods(schema);
        const latestPeriod = availablePeriods.length > 0 ? availablePeriods[0] : null;
        const latestYear = latestPeriod?.year || new Date().getFullYear();
        const latestMonth = latestPeriod?.month || new Date().getMonth() + 1;
        const previousYear = latestYear - 1;

        console.log(`[Comparison] Using latest period: ${latestYear}-${latestMonth} for ${schema}`);

        let query = "";

        if (schema === "loja_fisica") {
          switch (period) {
            case "daily":
              // Compara o mês mais recente com o mesmo mês do ano anterior
              query = `
                SELECT 
                  DAY(DATA) as dia,
                  YEAR(DATA) as ano,
                  MONTH(DATA) as mes,
                  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita
                FROM loja_fisica.caixas_venda
                WHERE (
                  (YEAR(DATA) = ${latestYear} AND MONTH(DATA) = ${latestMonth})
                  OR
                  (YEAR(DATA) = ${previousYear} AND MONTH(DATA) = ${latestMonth})
                )
                GROUP BY YEAR(DATA), MONTH(DATA), DAY(DATA)
                ORDER BY DAY(DATA), YEAR(DATA)
              `;
              break;

            case "weekly":
              // Compara semanas do ano atual com ano anterior
              query = `
                SELECT 
                  WEEK(DATA, 1) as semana,
                  YEAR(DATA) as ano,
                  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita
                FROM loja_fisica.caixas_venda
                WHERE YEAR(DATA) >= YEAR(CURDATE()) - 1
                GROUP BY YEAR(DATA), WEEK(DATA, 1)
                ORDER BY WEEK(DATA, 1), YEAR(DATA)
              `;
              break;

            case "monthly":
              query = `
                SELECT 
                  MONTH(DATA) as mes,
                  DATE_FORMAT(DATA, '%b') as mes_nome,
                  YEAR(DATA) as ano,
                  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita
                FROM loja_fisica.caixas_venda
                WHERE YEAR(DATA) >= YEAR(CURDATE()) - 1
                GROUP BY YEAR(DATA), MONTH(DATA), DATE_FORMAT(DATA, '%b')
                ORDER BY MONTH(DATA), YEAR(DATA)
              `;
              break;

            case "yearly":
              // Busca todos os anos disponíveis para comparação
              query = `
                SELECT 
                  YEAR(DATA) as ano,
                  SUM(VALOR_SUBT - VALOR_DESCONTO) as receita
                FROM loja_fisica.caixas_venda
                WHERE DATA IS NOT NULL
                GROUP BY YEAR(DATA)
                ORDER BY YEAR(DATA)
              `;
              break;
          }
        } else {
          // db_gringao - Usa view vw_revenue que tem dados desde 2023
          switch (period) {
            case "daily":
              // Compara o mês mais recente com o mesmo mês do ano anterior
              query = `
                SELECT 
                  DAY(data) as dia,
                  YEAR(data) as ano,
                  MONTH(data) as mes,
                  SUM(receita) as receita
                FROM db_gringao.vw_revenue
                WHERE (
                  (YEAR(data) = ${latestYear} AND MONTH(data) = ${latestMonth})
                  OR
                  (YEAR(data) = ${previousYear} AND MONTH(data) = ${latestMonth})
                )
                GROUP BY YEAR(data), MONTH(data), DAY(data)
                ORDER BY DAY(data), YEAR(data)
              `;
              break;

            case "weekly":
              // Compara semanas do ano mais recente com ano anterior
              query = `
                SELECT 
                  WEEK(data, 1) as semana,
                  YEAR(data) as ano,
                  SUM(receita) as receita
                FROM db_gringao.vw_revenue
                WHERE YEAR(data) >= ${previousYear}
                GROUP BY YEAR(data), WEEK(data, 1)
                ORDER BY WEEK(data, 1), YEAR(data)
              `;
              break;

            case "monthly":
              // Compara meses do ano mais recente com ano anterior
              query = `
                SELECT 
                  MONTH(data) as mes,
                  DATE_FORMAT(data, '%b') as mes_nome,
                  YEAR(data) as ano,
                  SUM(receita) as receita
                FROM db_gringao.vw_revenue
                WHERE YEAR(data) >= ${previousYear}
                GROUP BY YEAR(data), MONTH(data), DATE_FORMAT(data, '%b')
                ORDER BY MONTH(data), YEAR(data)
              `;
              break;

            case "yearly":
              // Busca todos os anos disponíveis na view para comparação (desde 2023)
              query = `
                SELECT 
                  YEAR(data) as ano,
                  SUM(receita) as receita
                FROM db_gringao.vw_revenue
                WHERE data IS NOT NULL
                GROUP BY YEAR(data)
                ORDER BY YEAR(data)
              `;
              break;
          }
        }

        console.log(`[Comparison] Executing query for ${schema} - ${period}:`);
        console.log(`[Comparison] SQL:`, query);

        const data = await executeExternalQuery(query, schema);

        console.log(`[Comparison] Query returned ${data.length} rows`);
        if (data.length > 0) {
          console.log(`[Comparison] First row sample:`, JSON.stringify(data[0]));
        }

        // Salva no cache (Redis e SQLite)
        const ttlSeconds = schema === 'db_gringao' ? 7200 : 1800; // 2h ou 30min
        await setCache(cacheKey, schema, data, ttlSeconds);

        console.log(`[Comparison] 💾 Cached ${cacheKey} (${data.length} rows)`);

        // Salva métricas
        await saveQueryMetrics({
          schema,
          executionTime: Date.now() - startTime,
          success: true,
          cached: false,
        });

        return {
          success: true,
          cached: false,
          data,
          period,
          schema,
          executionTime: Date.now() - startTime,
        };
      } catch (error: any) {
        console.error("[Comparison] Error fetching data:", error);

        // Salva métricas de erro
        await saveQueryMetrics({
          schema,
          executionTime: Date.now() - startTime,
          success: false,
          cached: false,
        });

        return {
          success: false,
          error: error.message,
          data: [],
        };
      }
    }),

  // Limpar cache do dashboard
  clearDashboardCache: protectedProcedure
    .input(
      z.object({
        schema: z.enum(["db_gringao", "loja_fisica"]).optional(),
        period: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { schema, period } = input;

        // Se especificou schema e período, limpa cache específico
        if (schema && period) {
          const dashboardKey = `dashboard:${schema}:${period}`;
          const comparisonKey = `comparison:${schema}:${period}`;

          await deleteCache(dashboardKey, schema);
          await deleteCache(comparisonKey, schema);

          console.log(`[Cache] 🗑️ Cleared cache for ${dashboardKey} and ${comparisonKey}`);

          return {
            success: true,
            message: `Cache cleared for ${schema} - ${period}`,
          };
        }

        // Se especificou apenas schema, limpa todo cache desse schema
        if (schema) {
          const { clearSchemaCache } = await import('./redis-cache');
          await clearSchemaCache(schema);
          await deleteCacheBySchema(schema);
          console.log(`[Cache] 🗑️ Cleared all cache for ${schema}`);
          return {
            success: true,
            message: `All cache cleared for ${schema}`,
          };
        }

        // Limpa todo o cache de dashboard e comparison
        const { clearSchemaCache } = await import('./redis-cache');
        await clearSchemaCache("db_gringao");
        await clearSchemaCache("loja_fisica");
        await deleteCacheBySchema("db_gringao");
        await deleteCacheBySchema("loja_fisica");
        console.log(`[Cache] 🗑️ Cleared all dashboard cache`);
        return {
          success: true,
          message: "All dashboard cache cleared",
        };
      } catch (error: any) {
        console.error("[Cache] Error clearing cache:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  query: protectedProcedure
    .input(
      z.object({
        question: z.string(),
        schema: z.enum(["db_gringao", "loja_fisica"]).optional(),
        llmProvider: z.enum(["openrouter", "gemini", "deepseek"]).default("openrouter"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      const sessionId = uuidv4();

      try {
        // 1. Verificar cache (Redis primeiro, depois SQLite fallback)
        if (input.schema) {
          const cacheKey = `query:${input.question}`;
          const cached = await getCache(cacheKey, input.schema);

          if (cached) {
            console.log("[Analytics] ✅ Cache hit (Redis/SQLite)!");
            await saveQueryMetrics({
              schema: input.schema,
              executionTime: Date.now() - startTime,
              success: true,
              cached: true,
            });

            return {
              success: true,
              cached: true,
              data: cached,
              executionTime: Date.now() - startTime,
              sessionId,
            };
          }
        }

        // 2. Analisar pergunta com LLM
        console.log("[Analytics] Analyzing question with LLM...");
        console.log("[Analytics] Question:", input.question);
        console.log("[Analytics] Schema:", input.schema);
        console.log("[Analytics] LLM Provider:", input.llmProvider);

        let analysis;
        try {
          analysis = await analyzeQuestion(
            input.question,
            input.schema,
            input.llmProvider
          );
          console.log("[Analytics] ✅ Analysis completed:", {
            schema: analysis.schema,
            visualizationType: analysis.visualizationType,
            isComparison: analysis.isComparison,
          });
        } catch (analysisError: any) {
          console.error("[Analytics] ❌ Error analyzing question:", analysisError);
          throw new Error(`Erro ao analisar a pergunta: ${analysisError.message}`);
        }

        // 3. Usar schema forçado se fornecido, senão usar o detectado pela LLM
        const schemaToUse = input.schema || analysis.schema;

        if (!schemaToUse) {
          throw new Error("Schema não foi especificado. Por favor, selecione E-commerce ou Loja Física na sidebar.");
        }

        // 4. Verificar se é uma comparação
        let results: any[] = [];
        let finalSQL = "";
        let comparisonResults: any = null;

        if (analysis.isComparison && analysis.comparisonQueries && analysis.comparisonQueries.length > 0) {
          console.log("[Analytics] 🔄 Comparison detected! Executing multiple queries...");

          // Executar cada query separadamente
          comparisonResults = [];
          for (const compQuery of analysis.comparisonQueries) {
            console.log(`[Analytics] Executing query for: ${compQuery.label}`);
            console.log(`[Analytics] SQL:`, compQuery.sqlQuery);

            const validation = validateAndFixSQL(compQuery.sqlQuery);
            const validatedSQL = validation.fixedSQL || compQuery.sqlQuery;

            try {
              const queryResults = await executeExternalQuery(validatedSQL, schemaToUse);
              console.log(`[Analytics] ✅ ${compQuery.label}: ${queryResults.length} rows`);

              comparisonResults.push({
                label: compQuery.label,
                period: compQuery.period,
                data: queryResults,
                sql: validatedSQL
              });
            } catch (error: any) {
              console.error(`[Analytics] ❌ Error in ${compQuery.label}:`, error.message);
              comparisonResults.push({
                label: compQuery.label,
                period: compQuery.period,
                data: [],
                error: error.message,
                sql: validatedSQL
              });
            }
          }

          // Combinar resultados para visualização
          results = comparisonResults;
          finalSQL = analysis.comparisonQueries.map(q => q.sqlQuery).join('\n\n--- NEXT QUERY ---\n\n');

        } else {
          // 4. Validar e corrigir SQL (query normal)
          const validation = validateAndFixSQL(analysis.sqlQuery);
          finalSQL = validation.fixedSQL || analysis.sqlQuery;

          if (!validation.isValid) {
            console.warn("[Analytics] SQL validation issues:", validation.errors);
          }

          // 5. Executar query no MySQL externo
          console.log("[Analytics] Executing query on external DB...");
          console.log("[Analytics] Schema:", schemaToUse);
          console.log("[Analytics] SQL:", finalSQL);
          results = await executeExternalQuery(finalSQL, schemaToUse);
          console.log("[Analytics] Query results:", results.length, "rows");
        }

        // 5.5. Se não houver resultados, buscar períodos disponíveis
        let availablePeriods: any[] = [];
        if (results.length === 0 && !analysis.isComparison) {
          console.log("[Analytics] No results found, fetching available periods...");
          availablePeriods = await getAvailablePeriods(schemaToUse);
          console.log("[Analytics] Available periods:", availablePeriods.length);
        }

        // 6. Gerar resposta em linguagem natural
        console.log("[Analytics] Generating natural language response...");
        const naturalResponse = await generateNaturalResponse(
          input.question,
          finalSQL,
          results,
          input.llmProvider,
          availablePeriods,
          analysis.isComparison || false
        );

        // 7. Formatar resposta
        const response = {
          question: input.question,
          sqlQuery: finalSQL,
          explanation: analysis.explanation,
          naturalAnswer: naturalResponse.answer,
          data: results,
          summary: `${results.length} registro(s) encontrado(s)`,
          insights: naturalResponse.insights,
          visualizationType: analysis.visualizationType,
          chartType: analysis.chartType,
          schema: schemaToUse,
          confidence: analysis.confidence,
          executionTime: Date.now() - startTime,
        };

        // 8. Salvar cache (Redis e SQLite)
        console.log("[Analytics] Saving cache...");
        const cacheKey = `query:${input.question}`;
        const ttlSeconds = schemaToUse === 'db_gringao' ? 7200 : 1800; // 2h ou 30min
        await setCache(cacheKey, schemaToUse, response, ttlSeconds);

        // 9. Salvar histórico (se ctx.user estiver disponível)
        console.log("[Analytics] Saving chat history...");
        try {
          if (ctx?.user?.id) {
            await saveChatHistory({
              userId: ctx.user.id,
              sessionId,
              question: input.question,
              sqlQuery: finalSQL,
              response: JSON.stringify(response),
              schema: schemaToUse,
              executionTime: Date.now() - startTime,
              success: true,
            });
          }
        } catch (historyError: any) {
          console.error("[Analytics] Failed to save chat history:", historyError);
          // Não falha a requisição se não conseguir salvar o histórico
        }

        // 10. Salvar métricas
        console.log("[Analytics] Saving metrics...");
        await saveQueryMetrics({
          schema: schemaToUse,
          executionTime: Date.now() - startTime,
          success: true,
          cached: false,
        });

        console.log("[Analytics] ✅ Query completed successfully!");

        return {
          success: true,
          cached: false,
          data: response,
          executionTime: Date.now() - startTime,
          sessionId,
        };
      } catch (error: any) {
        console.error("[Analytics] ❌ Error:", error);
        console.error("[Analytics] Error stack:", error.stack);

        // Salvar erro no histórico (se ctx.user estiver disponível)
        try {
          if (ctx?.user?.id) {
            await saveChatHistory({
              userId: ctx.user.id,
              sessionId,
              question: input.question,
              success: false,
              errorMessage: error.message,
            });
          }
        } catch (historyError: any) {
          console.error("[Analytics] Failed to save error history:", historyError);
        }

        throw new Error(`Erro ao processar a pergunta: ${error.message}`);
      }
    }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const history = await getChatHistory(ctx.user.id);
    return history;
  }),

  // Deletar item do histórico
  deleteHistory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { deleteChatHistoryItem } = await import("./db");
      await deleteChatHistoryItem(input.id, ctx.user.id);
      return { success: true };
    }),

  // Exportar dados do dashboard
  exportDashboard: protectedProcedure
    .input(
      z.object({
        schema: z.enum(["db_gringao", "loja_fisica"]),
        period: z.enum(["daily", "weekly", "monthly", "yearly"]),
        format: z.enum(["xlsx", "txt"]).default("xlsx"),
        includeComparison: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      try {
        const { schema, period, format, includeComparison } = input;

        // Busca dados do dashboard
        const dashboardKey = `dashboard:${schema}:${period}`;
        let dashboardData = await getCache(dashboardKey, schema);

        if (!dashboardData) {
          // Se não estiver em cache, busca do banco
          const availablePeriods = await getAvailablePeriods(schema);
          const latestPeriod = availablePeriods.length > 0 ? availablePeriods[0] : null;
          const latestYear = latestPeriod?.year || new Date().getFullYear();
          const latestMonth = latestPeriod?.month || new Date().getMonth() + 1;

          let query = "";
          if (schema === "loja_fisica") {
            switch (period) {
              case "monthly":
                query = `
                  SELECT 
                    MONTH(DATA) as mes_numero,
                    DATE_FORMAT(DATA, '%b') as mes,
                    SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
                    SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
                    SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro,
                    COUNT(DISTINCT BOLETA) as transacoes
                  FROM loja_fisica.caixas_venda
                  WHERE YEAR(DATA) = ${latestYear}
                  GROUP BY MONTH(DATA), DATE_FORMAT(DATA, '%b')
                  ORDER BY MONTH(DATA)
                `;
                break;
              case "yearly":
                query = `
                  SELECT 
                    YEAR(DATA) as ano,
                    SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
                    SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
                    SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro,
                    COUNT(DISTINCT BOLETA) as transacoes
                  FROM loja_fisica.caixas_venda
                  WHERE DATA IS NOT NULL
                  GROUP BY YEAR(DATA)
                  ORDER BY YEAR(DATA)
                `;
                break;
            }
          } else {
            switch (period) {
              case "monthly":
                query = `
                  SELECT 
                    MONTH(data) as mes_numero,
                    DATE_FORMAT(data, '%b') as mes,
                    SUM(receita) as receita,
                    SUM(custo) as custo,
                    SUM(lucro) as lucro,
                    SUM(transacoes) as transacoes
                  FROM db_gringao.vw_revenue
                  WHERE YEAR(data) = ${latestYear}
                  GROUP BY MONTH(data), DATE_FORMAT(data, '%b')
                  ORDER BY MONTH(data)
                `;
                break;
              case "yearly":
                query = `
                  SELECT 
                    YEAR(data) as ano,
                    SUM(receita) as receita,
                    SUM(custo) as custo,
                    SUM(lucro) as lucro,
                    SUM(transacoes) as transacoes
                  FROM db_gringao.vw_revenue
                  WHERE data IS NOT NULL
                  GROUP BY YEAR(data)
                  ORDER BY YEAR(data)
                `;
                break;
            }
          }

          if (query) {
            dashboardData = await executeExternalQuery(query, schema);
          }
        }

        if (!dashboardData || dashboardData.length === 0) {
          throw new Error('Nenhum dado disponível para exportar.');
        }

        // Busca dados de comparação se solicitado
        let comparisonData: any[] | undefined;
        if (includeComparison) {
          const comparisonKey = `comparison:${schema}:${period}`;
          comparisonData = await getCache(comparisonKey, schema);
        }

        // Gera arquivo
        const filename = generateFilename('dashboard', schema, period, format);

        if (format === 'xlsx') {
          const buffer = exportDashboardToExcel(dashboardData, comparisonData, schema, period);
          return {
            success: true,
            filename,
            data: buffer.toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          };
        } else {
          const txtContent = exportToTXT(dashboardData);
          return {
            success: true,
            filename,
            data: Buffer.from(txtContent, 'utf-8').toString('base64'),
            mimeType: 'text/plain',
          };
        }
      } catch (error: any) {
        console.error('[Export] ❌ Error:', error);
        throw new Error(`Erro ao exportar dados: ${error.message}`);
      }
    }),

  // Exportar dados de query/resposta
  exportQuery: protectedProcedure
    .input(
      z.object({
        data: z.array(z.any()),
        format: z.enum(["xlsx", "txt"]).default("xlsx"),
        filename: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { data, format, filename: customFilename } = input;

        if (!data || data.length === 0) {
          throw new Error('Nenhum dado disponível para exportar.');
        }

        const filename = customFilename || generateFilename('query', undefined, undefined, format);

        if (format === 'xlsx') {
          const buffer = exportToExcel(data, filename);
          return {
            success: true,
            filename,
            data: buffer.toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          };
        } else {
          const txtContent = exportToTXT(data);
          return {
            success: true,
            filename,
            data: Buffer.from(txtContent, 'utf-8').toString('base64'),
            mimeType: 'text/plain',
          };
        }
      } catch (error: any) {
        console.error('[Export] ❌ Error:', error);
        throw new Error(`Erro ao exportar dados: ${error.message}`);
      }
    }),

  // Buscar dados de produtos com informações completas
  getProductsData: protectedProcedure
    .input(
      z.object({
        schema: z.enum(["db_gringao", "loja_fisica"]),
        limit: z.number().optional().default(100),
        offset: z.number().optional().default(0),
        search: z.string().optional(),
        forceRefresh: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      try {
        const { schema, limit, offset, search, forceRefresh } = input;
        const startTime = Date.now();

        // Gera chave de cache única baseada nos parâmetros
        const searchKey = search ? `:search:${search.toLowerCase().trim()}` : '';
        const cacheKey = `products:${schema}:limit:${limit}:offset:${offset}${searchKey}`;

        console.log(`[Products] 📊 Parâmetros: schema=${schema}, limit=${limit}, offset=${offset}, search=${search || 'nenhum'}`);

        // Verifica cache (Redis primeiro, depois SQLite fallback)
        if (!forceRefresh) {
          console.log(`[Products] 🔍 Verificando cache para: ${cacheKey}`);
          const cached = await getCache(cacheKey, schema);
          if (cached && Array.isArray(cached) && cached.length > 0) {
            console.log(`[Products] ✅ Cache hit: ${cacheKey} (${cached.length} produtos)`);
            // Busca total mesmo com cache (mas usa cache para o total também se disponível)
            let totalCount = 0;
            const totalCacheKey = `products:${schema}:total${searchKey}`;
            const cachedTotal = await getCache(totalCacheKey, schema);

            if (cachedTotal !== null && typeof cachedTotal === 'number') {
              totalCount = cachedTotal;
              console.log(`[Products] ✅ Total do cache: ${totalCount}`);
            } else {
              try {
                let countQuery = "";
                if (schema === "loja_fisica") {
                  const whereClause = search
                    ? `WHERE vw.DESCRICAO LIKE '%${search.replace(/'/g, "''")}%' OR vw.CODIGO_INTERNO LIKE '%${search.replace(/'/g, "''")}%'`
                    : '';
                  countQuery = `SELECT COUNT(DISTINCT vw.CODIGO_INTERNO) as total FROM loja_fisica.vw_dprodutos vw ${whereClause}`;
                } else {
                  const whereClause = search
                    ? `WHERE p.nome LIKE '%${search.replace(/'/g, "''")}%' OR p.codigo LIKE '%${search.replace(/'/g, "''")}%'`
                    : '';
                  countQuery = `SELECT COUNT(*) as total FROM db_gringao.bling2_produtos p ${whereClause}`;
                }
                const countResult = await executeExternalQuery(countQuery, schema);
                totalCount = countResult[0]?.total || cached.length;
                // Salva total no cache também
                await setCache(totalCacheKey, schema, totalCount, schema === 'db_gringao' ? 7200 : 1800);
              } catch (error) {
                console.error(`[Products] ⚠️ Erro ao contar total:`, error);
                totalCount = cached.length; // Fallback
              }
            }

            return {
              success: true,
              data: cached,
              total: totalCount,
              executionTime: Date.now() - startTime,
              cached: true,
            };
          } else {
            console.log(`[Products] ❌ Cache miss ou vazio: ${cacheKey}`);
          }
        }

        console.log(`[Products] 🔍 Cache miss: ${cacheKey}, buscando do banco...`);

        let query = "";

        if (schema === "loja_fisica") {
          // Query para loja_fisica com todas as informações
          const whereClause = search
            ? `WHERE vw.DESCRICAO LIKE '%${search.replace(/'/g, "''")}%' OR vw.CODIGO_INTERNO LIKE '%${search.replace(/'/g, "''")}%'`
            : '';

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
            ${whereClause}
            GROUP BY 
              vw.CODIGO_INTERNO, 
              vw.img, 
              vw.DESCRICAO
            ORDER BY quantidade_vendida DESC, vw.CODIGO_INTERNO ASC
            LIMIT ${limit} OFFSET ${offset}
          `;
        } else {
          // Query para db_gringao - mostra TODOS os produtos ordenados por vendas
          const whereClause = search
            ? `WHERE p.nome LIKE '%${search.replace(/'/g, "''")}%' OR p.codigo LIKE '%${search.replace(/'/g, "''")}%'`
            : '';

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
            ${whereClause}
            GROUP BY 
              p.codigo, 
              p.imagemURL, 
              p.nome, 
              p.estoque, 
              p.precoCusto
            ORDER BY quantidade_vendida DESC, p.codigo ASC
            LIMIT ${limit} OFFSET ${offset}
          `;
        }

        // Busca total de produtos PRIMEIRO (sem LIMIT) para paginação correta
        let totalCount = 0;
        try {
          let countQuery = "";
          if (schema === "loja_fisica") {
            const whereClause = search
              ? `WHERE vw.DESCRICAO LIKE '%${search.replace(/'/g, "''")}%' OR vw.CODIGO_INTERNO LIKE '%${search.replace(/'/g, "''")}%'`
              : '';
            countQuery = `SELECT COUNT(DISTINCT vw.CODIGO_INTERNO) as total FROM loja_fisica.vw_dprodutos vw ${whereClause}`;
          } else {
            const whereClause = search
              ? `WHERE p.nome LIKE '%${search.replace(/'/g, "''")}%' OR p.codigo LIKE '%${search.replace(/'/g, "''")}%'`
              : '';
            countQuery = `SELECT COUNT(*) as total FROM db_gringao.bling2_produtos p ${whereClause}`;
          }
          console.log(`[Products] 🔢 Query de contagem:`, countQuery);
          const countResult = await executeExternalQuery(countQuery, schema);
          totalCount = countResult[0]?.total || 0;
          console.log(`[Products] 📊 Total de produtos encontrados: ${totalCount}`);
        } catch (error) {
          console.error(`[Products] ⚠️ Erro ao contar total:`, error);
          totalCount = 0; // Não usa data.length como fallback
        }

        console.log(`[Products] 🔍 Query de dados:`, query.substring(0, 200) + '...');
        const queryStartTime = Date.now();
        const data = await executeExternalQuery(query, schema);
        const queryTime = Date.now() - queryStartTime;
        console.log(`[Products] ✅ ${data.length} produtos retornados (offset: ${offset}, limit: ${limit}) em ${queryTime}ms`);

        // Salva no cache (Redis + SQLite) de forma assíncrona para não bloquear resposta
        // Cache mais longo para backup incremental (db_gringao), mais curto para dados em tempo real (loja_fisica)
        const cacheTTL = schema === 'db_gringao' ? 7200 : 1800; // 2h vs 30min (em segundos)

        // Salva dados da página
        setCache(cacheKey, schema, data, cacheTTL).then(() => {
          console.log(`[Products] 💾 Cache salvo: ${cacheKey} (TTL: ${cacheTTL}s)`);
        }).catch(err => {
          console.error(`[Products] ⚠️ Erro ao salvar cache:`, err);
        });

        // Salva total também no cache
        const totalCacheKey = `products:${schema}:total${searchKey}`;
        setCache(totalCacheKey, schema, totalCount, cacheTTL).catch(err => {
          console.error(`[Products] ⚠️ Erro ao salvar total no cache:`, err);
        });

        return {
          success: true,
          data,
          total: totalCount,
          executionTime: Date.now() - startTime,
          cached: false,
        };
      } catch (error: any) {
        console.error('[Products] ❌ Error:', error);
        throw new Error(`Erro ao buscar dados de produtos: ${error.message}`);
      }
    }),

  // Gerenciamento de Cache
  getCacheStatus: protectedProcedure
    .query(async () => {
      try {
        const { getCacheStats, isRedisEnabled } = await import('./redis-cache');
        const stats = await getCacheStats();

        return {
          status: isRedisEnabled() ? 'connected' : 'disconnected',
          redisHost: stats.redisHost,
          redisPort: stats.redisPort,
          redisCacheSize: stats.redisCacheSize,
          memoryCacheSize: stats.memoryCacheSize,
          sqliteCacheSize: stats.sqliteCacheSize,
          hitRate: stats.hitRate,
          schemaStats: stats.schemaStats,
        };
      } catch (error: any) {
        console.error('[Cache] Erro ao obter status:', error);
        return {
          status: 'error',
          redisHost: 'localhost',
          redisPort: 6379,
          redisCacheSize: 0,
          memoryCacheSize: 0,
          sqliteCacheSize: 0,
          schemaStats: { db_gringao: 0, loja_fisica: 0 },
        };
      }
    }),

  clearCache: protectedProcedure
    .mutation(async () => {
      try {
        const { clearSchemaCache } = await import('./redis-cache');
        const { clearMemoryCache } = await import('./memory-cache');
        const { deleteCacheBySchema } = await import('./db');

        // Limpa todos os schemas
        await clearSchemaCache('db_gringao');
        await clearSchemaCache('loja_fisica');
        clearMemoryCache();
        await deleteCacheBySchema('db_gringao');
        await deleteCacheBySchema('loja_fisica');

        return { success: true, message: 'Cache limpo com sucesso' };
      } catch (error: any) {
        console.error('[Cache] Erro ao limpar cache:', error);
        throw new Error(`Erro ao limpar cache: ${error.message}`);
      }
    }),

  clearSchemaCache: protectedProcedure
    .input(z.object({
      schema: z.enum(['db_gringao', 'loja_fisica']),
    }))
    .mutation(async ({ input }) => {
      try {
        const { clearSchemaCache } = await import('./redis-cache');
        const { deleteCacheBySchema } = await import('./db');

        await clearSchemaCache(input.schema);
        await deleteCacheBySchema(input.schema);

        return { success: true, message: `Cache de ${input.schema} limpo com sucesso` };
      } catch (error: any) {
        console.error('[Cache] Erro ao limpar cache do schema:', error);
        throw new Error(`Erro ao limpar cache: ${error.message}`);
      }
    }),

  preloadCache: protectedProcedure
    .mutation(async () => {
      try {
        const { preloadAllProducts } = await import('./products-cache-middleware');
        const { preloadCriticalCache } = await import('./cache-middleware');
        const { executeExternalQuery } = await import('./external-db');

        // Pré-carrega produtos
        await preloadAllProducts();

        // Pré-carrega dashboard crítico
        const fetchFunctions = new Map();

        // Dashboard Loja Física
        fetchFunctions.set('dashboard:loja_fisica:monthly', {
          schema: 'loja_fisica',
          fn: () => executeExternalQuery(`
            SELECT 
              MONTH(DATA) as mes_numero,
              DATE_FORMAT(DATA, '%b') as mes,
              SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
              SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
              SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro,
              COUNT(DISTINCT BOLETA) as transacoes
            FROM loja_fisica.caixas_venda
            WHERE YEAR(DATA) = YEAR(CURDATE())
            GROUP BY MONTH(DATA), DATE_FORMAT(DATA, '%b')
            ORDER BY MONTH(DATA)
          `, 'loja_fisica'),
        });

        // Dashboard E-commerce
        fetchFunctions.set('dashboard:db_gringao:monthly', {
          schema: 'db_gringao',
          fn: () => executeExternalQuery(`
            SELECT 
              MONTH(data) as mes_numero,
              DATE_FORMAT(data, '%b') as mes,
              SUM(total) as receita,
              SUM(total * 0.52) as custo,
              SUM(total * 0.48) as lucro,
              COUNT(DISTINCT id) as transacoes
            FROM db_gringao.vw_revenue
            WHERE YEAR(data) = YEAR(CURDATE())
            GROUP BY MONTH(data), DATE_FORMAT(data, '%b')
            ORDER BY MONTH(data)
          `, 'db_gringao'),
        });

        await preloadCriticalCache(fetchFunctions);

        return { success: true, message: 'Cache pré-carregado com sucesso' };
      } catch (error: any) {
        console.error('[Cache] Erro ao pré-carregar cache:', error);
        throw new Error(`Erro ao pré-carregar cache: ${error.message}`);
      }
    }),
});

import { authRouter } from "./auth-router";

// Router principal
export const appRouter = router({
  analytics: analyticsRouter,
  auth: authRouter,

  // Endpoint de health check
  health: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
});

export type AppRouter = typeof appRouter;

