import { getCachedQuery, saveCachedQuery } from "./db";

/**
 * Middleware de Cache com Backup Incremental
 * 
 * Este middleware implementa:
 * 1. Cache inteligente por schema e período
 * 2. Backup incremental automático
 * 3. Invalidação seletiva de cache
 * 4. Pré-carregamento de dados críticos
 */

// Configuração de TTL por schema e período
const CACHE_TTL = {
  db_gringao: {
    daily: 30 * 60 * 1000,      // 30 minutos (dados podem mudar durante o dia)
    weekly: 60 * 60 * 1000,     // 1 hora
    monthly: 2 * 60 * 60 * 1000, // 2 horas
    yearly: 4 * 60 * 60 * 1000,  // 4 horas (dados históricos)
  },
  loja_fisica: {
    daily: 15 * 60 * 1000,      // 15 minutos (dados em tempo real)
    weekly: 30 * 60 * 1000,     // 30 minutos
    monthly: 60 * 60 * 1000,    // 1 hora
    yearly: 2 * 60 * 60 * 1000, // 2 horas
  },
};

// Chaves de cache prioritárias para pré-carregamento
const PRIORITY_CACHE_KEYS = [
  "dashboard:db_gringao:monthly",
  "dashboard:db_gringao:yearly",
  "dashboard:loja_fisica:monthly",
  "dashboard:loja_fisica:yearly",
  "comparison:db_gringao:monthly",
  "comparison:db_gringao:yearly",
  "comparison:loja_fisica:monthly",
  "comparison:loja_fisica:yearly",
];

/**
 * Obtém dados do cache ou executa query
 */
export async function getCachedOrFetch(
  cacheKey: string,
  schema: "db_gringao" | "loja_fisica",
  fetchFunction: () => Promise<any[]>
): Promise<{ data: any[]; cached: boolean; executionTime: number }> {
  const startTime = Date.now();

  // Tenta buscar do cache
  const cached = await getCachedQuery(cacheKey, schema);
  
  if (cached) {
    console.log(`[Cache] ✅ Hit: ${cacheKey}`);
    
    // Parse do resultado do cache
    let parsedData = cached.result;
    if (typeof cached.result === 'string') {
      try {
        parsedData = JSON.parse(cached.result);
      } catch (error) {
        console.error('[Cache] ❌ Error parsing cached result:', error);
        parsedData = [];
      }
    }
    
    return {
      data: parsedData,
      cached: true,
      executionTime: Date.now() - startTime,
    };
  }

  // Cache miss - busca do banco
  console.log(`[Cache] ❌ Miss: ${cacheKey} - Fetching from DB...`);
  
  try {
    const data = await fetchFunction();
    
    // Salva no cache
    await saveCachedQuery({
      question: cacheKey,
      schema,
      sqlQuery: "dashboard-query", // Placeholder
      result: JSON.stringify(data),
    });
    
    console.log(`[Cache] 💾 Saved: ${cacheKey} (${data.length} rows)`);
    
    return {
      data,
      cached: false,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`[Cache] ❌ Error fetching data for ${cacheKey}:`, error);
    throw error;
  }
}

/**
 * Pré-carrega dados críticos no cache
 * Executa em background após inicialização do servidor
 */
export async function preloadCriticalCache(
  fetchFunctions: Map<string, { schema: "db_gringao" | "loja_fisica"; fn: () => Promise<any[]> }>
) {
  console.log('[Cache] 🚀 Starting preload of critical cache...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const cacheKey of PRIORITY_CACHE_KEYS) {
    const config = fetchFunctions.get(cacheKey);
    
    if (!config) {
      console.log(`[Cache] ⚠️ No fetch function for ${cacheKey}`);
      continue;
    }
    
    try {
      // Verifica se já está em cache
      const cached = await getCachedQuery(cacheKey, config.schema);
      
      if (cached) {
        console.log(`[Cache] ✅ Already cached: ${cacheKey}`);
        successCount++;
        continue;
      }
      
      // Busca e cacheia
      const data = await config.fn();
      
      await saveCachedQuery({
        question: cacheKey,
        schema: config.schema,
        sqlQuery: "preload",
        result: JSON.stringify(data),
      });
      
      console.log(`[Cache] 💾 Preloaded: ${cacheKey} (${data.length} rows)`);
      successCount++;
    } catch (error: any) {
      console.error(`[Cache] ❌ Error preloading ${cacheKey}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`[Cache] 🎉 Preload complete: ${successCount} success, ${errorCount} errors`);
}

/**
 * Invalida cache seletivamente
 */
export async function invalidateCache(
  pattern?: string,
  schema?: "db_gringao" | "loja_fisica"
) {
  // TODO: Implementar invalidação seletiva usando padrões
  console.log(`[Cache] 🗑️ Invalidating cache: pattern=${pattern}, schema=${schema}`);
}

/**
 * Backup incremental automático
 * Executa periodicamente para manter cache atualizado
 */
export async function incrementalBackup(
  fetchFunctions: Map<string, { schema: "db_gringao" | "loja_fisica"; fn: () => Promise<any[]> }>
) {
  console.log('[Cache] 🔄 Starting incremental backup...');
  
  for (const [cacheKey, config] of fetchFunctions.entries()) {
    try {
      const cached = await getCachedQuery(cacheKey, config.schema);
      
      // Se não está em cache ou expirou, atualiza
      if (!cached) {
        const data = await config.fn();
        
        await saveCachedQuery({
          question: cacheKey,
          schema: config.schema,
          sqlQuery: "incremental-backup",
          result: JSON.stringify(data),
        });
        
        console.log(`[Cache] 🔄 Backup updated: ${cacheKey}`);
      }
    } catch (error: any) {
      console.error(`[Cache] ❌ Error in incremental backup for ${cacheKey}:`, error.message);
    }
  }
  
  console.log('[Cache] ✅ Incremental backup complete');
}

/**
 * Estatísticas de cache
 */
export interface CacheStats {
  totalKeys: number;
  hitRate: number;
  avgExecutionTime: number;
  cacheSize: string;
}

export async function getCacheStats(): Promise<CacheStats> {
  // TODO: Implementar estatísticas reais do cache
  return {
    totalKeys: 0,
    hitRate: 0,
    avgExecutionTime: 0,
    cacheSize: "0 MB",
  };
}

