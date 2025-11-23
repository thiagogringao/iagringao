/**
 * Cache em memória como fallback quando Redis não está disponível
 * Usa Map do Node.js para armazenar dados em memória
 */

interface CacheEntry {
  value: any;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Limpa entradas expiradas a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Obtém valor do cache
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verifica se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Salva valor no cache
   */
  set(key: string, value: any, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : 3600000; // Default: 1 hora
    const expiresAt = Date.now() + ttl;

    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * Deleta valor do cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpa todas as chaves que começam com um prefixo
   */
  clearByPattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpa todas as entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Destrói o cache e limpa o intervalo
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Instância global do cache em memória
let memoryCache: MemoryCache | null = null;

/**
 * Obtém ou cria a instância do cache em memória
 */
export function getMemoryCache(): MemoryCache {
  if (!memoryCache) {
    memoryCache = new MemoryCache();
    console.log('[MemoryCache] ✅ Cache em memória inicializado');
  }
  return memoryCache;
}

/**
 * Limpa o cache em memória
 */
export function clearMemoryCache(): void {
  if (memoryCache) {
    memoryCache.clear();
    console.log('[MemoryCache] 🗑️ Cache em memória limpo');
  }
}

