import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import { getCachedQuery, saveCachedQuery } from './db';

dotenv.config();

let redisClient: Redis | null = null;
let redisEnabled = false;

/**
 * Inicializa conexão com Redis
 */
export async function initRedis(): Promise<boolean> {
  try {
    redisHost = process.env.REDIS_HOST || 'localhost';
    redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD;
    const redisDb = parseInt(process.env.REDIS_DB || '0');

    console.log(`[Redis] 🔴 Tentando conectar em ${redisHost}:${redisPort} (DB: ${redisDb})...`);

    redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword || undefined,
      db: redisDb,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 5000, // 5 segundos timeout
    });

    redisClient.on('error', (error) => {
      console.error('[Redis] ❌ Connection error:', error.message);
      redisEnabled = false;
    });

    redisClient.on('connect', () => {
      console.log('[Redis] 🔌 Connecting...');
    });

    redisClient.on('ready', () => {
      console.log('[Redis] ✅ Ready and connected');
      redisEnabled = true;
    });

    redisClient.on('close', () => {
      console.log('[Redis] 🔌 Connection closed');
      redisEnabled = false;
    });

    await redisClient.connect();
    
    // Testa a conexão fazendo um ping
    const pong = await redisClient.ping();
    if (pong === 'PONG') {
      redisEnabled = true;
      console.log(`[Redis] ✅ Connected and tested successfully at ${redisHost}:${redisPort}`);
      return true;
    } else {
      console.warn('[Redis] ⚠️ Ping failed, falling back to SQLite cache');
      redisEnabled = false;
      return false;
    }
  } catch (error: any) {
    console.warn('[Redis] ⚠️ Failed to connect, falling back to SQLite cache:', error.message);
    console.warn('[Redis] 💡 Dica: Certifique-se de que o Redis está rodando. Execute: redis-server');
    redisEnabled = false;
    return false;
  }
}

/**
 * Obtém valor do cache (Redis ou SQLite fallback)
 */
export async function getCache(key: string, schema: string): Promise<any | null> {
  const startTime = Date.now();
  const cacheKey = `cache:${schema}:${key}`;
  
  // Tenta Redis primeiro
  if (redisEnabled && redisClient) {
    try {
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        const parseTime = Date.now() - startTime;
        console.log(`[Redis] ✅ Cache hit: ${cacheKey} (${parseTime}ms)`);
        return JSON.parse(cached);
      }
    } catch (error: any) {
      console.error('[Redis] ❌ Error getting cache:', error.message);
      // Fallback para cache em memória
    }
  }

  // Fallback para cache em memória (mais rápido que SQLite)
  try {
    const memoryCache = getMemoryCache();
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      const memoryTime = Date.now() - startTime;
      console.log(`[MemoryCache] ✅ Cache hit: ${cacheKey} (${memoryTime}ms)`);
      return cached;
    }
  } catch (error: any) {
    console.error('[MemoryCache] ❌ Error getting cache:', error.message);
  }

  // Último fallback: SQLite
  try {
    const cached = await getCachedQuery(key, schema);
    if (cached) {
      const sqliteTime = Date.now() - startTime;
      console.log(`[SQLite] ✅ Cache hit: ${key} (${sqliteTime}ms)`);
      let parsedData = cached.result;
      if (typeof cached.result === 'string') {
        parsedData = JSON.parse(cached.result);
      }
      return parsedData;
    }
  } catch (error: any) {
    console.error('[SQLite] ❌ Error getting cache:', error.message);
  }

  return null;
}

/**
 * Salva valor no cache (Redis e SQLite)
 */
export async function setCache(
  key: string,
  schema: string,
  value: any,
  ttlSeconds?: number
): Promise<void> {
  const cacheKey = `cache:${schema}:${key}`;
  const serialized = JSON.stringify(value);
  const defaultTTL = schema === 'db_gringao' ? 7200 : 1800; // 2h ou 30min
  const finalTTL = ttlSeconds || defaultTTL;

  // Salva no Redis
  if (redisEnabled && redisClient) {
    try {
      await redisClient.setex(cacheKey, finalTTL, serialized);
      // Log apenas para chaves importantes (não produtos individuais para reduzir logs)
      if (!cacheKey.includes('products:')) {
        console.log(`[Redis] 💾 Cache saved: ${cacheKey} (TTL: ${finalTTL}s)`);
      }
    } catch (error: any) {
      console.error('[Redis] ❌ Error saving cache:', error.message);
    }
  }

  // Salva no cache em memória também (fallback rápido)
  try {
    const memoryCache = getMemoryCache();
    memoryCache.set(cacheKey, value, finalTTL);
  } catch (error: any) {
    console.error('[MemoryCache] ❌ Error saving cache:', error.message);
  }

  // Salva no SQLite também (backup persistente)
  try {
    await saveCachedQuery({
      question: key,
      schema,
      sqlQuery: 'redis-cache',
      result: value,
    });
  } catch (error: any) {
    console.error('[SQLite] ❌ Error saving cache:', error.message);
  }
}

/**
 * Deleta valor do cache
 */
export async function deleteCache(key: string, schema: string): Promise<void> {
  const cacheKey = `cache:${schema}:${key}`;

  // Deleta do Redis
  if (redisEnabled && redisClient) {
    try {
      await redisClient.del(cacheKey);
      console.log(`[Redis] 🗑️ Cache deleted: ${cacheKey}`);
    } catch (error: any) {
      console.error('[Redis] ❌ Error deleting cache:', error.message);
    }
  }

  // Deleta do cache em memória
  try {
    const memoryCache = getMemoryCache();
    memoryCache.delete(cacheKey);
  } catch (error: any) {
    console.error('[MemoryCache] ❌ Error deleting cache:', error.message);
  }

  // Deleta do SQLite também
  try {
    const { deleteCachedQuery } = await import('./db');
    await deleteCachedQuery(key, schema);
  } catch (error: any) {
    console.error('[SQLite] ❌ Error deleting cache:', error.message);
  }
}

/**
 * Limpa todo o cache de um schema
 */
export async function clearSchemaCache(schema: string): Promise<void> {
  const pattern = `cache:${schema}:*`;
  
  // Limpa do Redis
  if (redisEnabled && redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log(`[Redis] 🗑️ Cleared ${keys.length} keys for schema: ${schema}`);
      }
    } catch (error: any) {
      console.error('[Redis] ❌ Error clearing schema cache:', error.message);
    }
  }

  // Limpa do cache em memória
  try {
    const memoryCache = getMemoryCache();
    memoryCache.clearByPattern(pattern);
    console.log(`[MemoryCache] 🗑️ Cleared cache for schema: ${schema}`);
  } catch (error: any) {
    console.error('[MemoryCache] ❌ Error clearing schema cache:', error.message);
  }
}

/**
 * Verifica se Redis está disponível
 */
export function isRedisEnabled(): boolean {
  return redisEnabled && redisClient !== null;
}

/**
 * Obtém estatísticas do cache
 */
export async function getCacheStats(): Promise<{
  redisEnabled: boolean;
  redisHost: string;
  redisPort: number;
  redisCacheSize: number;
  memoryCacheSize: number;
  sqliteCacheSize: number;
  hitRate?: number;
  schemaStats: {
    db_gringao: number;
    loja_fisica: number;
  };
}> {
  let redisCacheSize = 0;
  let schemaStats = { db_gringao: 0, loja_fisica: 0 };

  // Conta chaves no Redis
  if (redisEnabled && redisClient) {
    try {
      const keys = await redisClient.keys('cache:*');
      redisCacheSize = keys.length;
      
      // Conta por schema
      const dbGringaoKeys = keys.filter(k => k.includes(':db_gringao:'));
      const lojaFisicaKeys = keys.filter(k => k.includes(':loja_fisica:'));
      schemaStats.db_gringao = dbGringaoKeys.length;
      schemaStats.loja_fisica = lojaFisicaKeys.length;
    } catch (error) {
      console.error('[Redis] Erro ao contar chaves:', error);
    }
  }

  // Conta chaves no cache em memória
  const memoryCache = getMemoryCache();
  const memoryStats = memoryCache.getStats();
  const memoryCacheSize = memoryStats.size;

  // Conta no SQLite (aproximado)
  let sqliteCacheSize = 0;
  try {
    // Busca todas as entradas de cache do SQLite
    const Database = (await import('better-sqlite3')).default;
    const sqlite = new Database('./joalheria_analytics.db', { readonly: true });
    const result = sqlite.prepare('SELECT COUNT(*) as count FROM cached_queries').get() as { count: number };
    sqliteCacheSize = result?.count || 0;
    sqlite.close();
  } catch (error) {
    console.error('[SQLite] Erro ao contar cache:', error);
  }

  return {
    redisEnabled,
    redisHost,
    redisPort,
    redisCacheSize,
    memoryCacheSize,
    sqliteCacheSize,
    schemaStats,
  };
}

/**
 * Fecha conexão com Redis
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    redisEnabled = false;
    console.log('[Redis] 🔌 Connection closed');
  }
}


