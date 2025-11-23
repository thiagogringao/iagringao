import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import type { Context } from './trpc';
import * as dotenv from 'dotenv';
import compression from 'compression';
import cors from 'cors';
import { preloadCriticalCache, incrementalBackup } from './cache-middleware';
import { preloadAllProducts } from './products-cache-middleware';
import { executeExternalQuery } from './external-db';
import { initRedis, closeRedis } from './redis-cache';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression()); // Compressão Gzip para todas as respostas
app.use(cors());
// Aumenta limite do body parser para permitir exportação de grandes volumes de dados (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mock auth middleware (em produção, use autenticação real)
app.use((req, res, next) => {
  // Simula um usuário autenticado para desenvolvimento
  (req as any).user = {
    id: 1,
    name: 'Usuário Demo',
    email: 'demo@joalheria.com',
  };
  next();
});

// Middleware de autenticação JWT
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (token) {
    try {
      const { verifyToken } = require('./auth');
      const payload = verifyToken(token);

      if (payload) {
        // Busca informações completas do usuário
        const { getDb } = require('./db');
        const { users } = require('../drizzle/schema');
        const { eq } = require('drizzle-orm');

        getDb().then(async (db: any) => {
          if (db) {
            const userResult = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
            if (userResult.length > 0) {
              (req as any).user = {
                id: userResult[0].id,
                email: userResult[0].email,
                name: userResult[0].name,
                role: userResult[0].role,
              };
            }
          }
          next();
        }).catch(() => next());
      } else {
        next();
      }
    } catch (error) {
      next();
    }
  } else {
    next();
  }
});

// tRPC endpoint
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: ({ req }): Context => {
      return {
        user: (req as any).user,
      };
    },
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 tRPC endpoint: http://localhost:${PORT}/trpc`);

  // Inicializa sistema de cache (Redis -> Memória -> SQLite)
  console.log('\n🔴 Inicializando sistema de cache...\n');
  const redisConnected = await initRedis();

  // Cache em memória sempre disponível como fallback rápido
  const { getMemoryCache } = await import('./memory-cache');
  getMemoryCache();
  console.log('✅ Cache em memória inicializado (sempre disponível)\n');

  if (!redisConnected) {
    console.log('⚠️  Redis não está disponível. Usando cache em memória (rápido) + SQLite (backup).\n');
    console.log('💡 Para melhor performance, instale Redis:\n');
    console.log('   npm run redis:install-windows\n');
    console.log('   Ou baixe manualmente: https://github.com/tporadowski/redis/releases\n');
  } else {
    console.log('✅ Redis conectado! Cache em 3 camadas: Redis -> Memória -> SQLite\n');
  }

  // Aguarda 2 segundos para o servidor estabilizar
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Pré-carrega cache crítico em background
  console.log('\n🔄 Iniciando pré-carregamento de cache...\n');

  const fetchFunctions = new Map<string, { schema: "db_gringao" | "loja_fisica"; fn: () => Promise<any[]> }>();

  // Dashboard - Loja Física
  fetchFunctions.set("dashboard:loja_fisica:monthly", {
    schema: "loja_fisica",
    fn: () => executeExternalQuery(`
      SELECT 
        MONTH(DATA) as mes_numero,
        DATE_FORMAT(DATA, '%b') as mes,
        SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
        SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
        SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro,
        COUNT(DISTINCT BOLETA) as transacoes
      FROM loja_fisica.caixas_venda
      WHERE YEAR(DATA) = 2025
      GROUP BY MONTH(DATA), DATE_FORMAT(DATA, '%b')
      ORDER BY MONTH(DATA)
    `, "loja_fisica")
  });

  fetchFunctions.set("dashboard:loja_fisica:yearly", {
    schema: "loja_fisica",
    fn: () => executeExternalQuery(`
      SELECT 
        YEAR(DATA) as ano,
        SUM(VALOR_SUBT - VALOR_DESCONTO) as receita,
        SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.52) as custo,
        SUM((VALOR_SUBT - VALOR_DESCONTO) * 0.48) as lucro,
        COUNT(DISTINCT BOLETA) as transacoes
      FROM loja_fisica.caixas_venda
      WHERE YEAR(DATA) >= 2023
      GROUP BY YEAR(DATA)
      ORDER BY YEAR(DATA)
    `, "loja_fisica")
  });

  // Dashboard - E-commerce (será atualizado dinamicamente pelo router)
  // As queries são geradas dinamicamente baseadas nos períodos disponíveis

  fetchFunctions.set("dashboard:db_gringao:yearly", {
    schema: "db_gringao",
    fn: () => executeExternalQuery(`
      SELECT 
        YEAR(data) as ano,
        SUM(total) as receita,
        SUM(total * 0.52) as custo,
        SUM(total * 0.48) as lucro,
        COUNT(DISTINCT id) as transacoes
      FROM db_gringao.bling2_pedidos
      WHERE YEAR(data) >= 2023
      GROUP BY YEAR(data)
      ORDER BY YEAR(data)
    `, "db_gringao")
  });

  // Comparison - Loja Física
  fetchFunctions.set("comparison:loja_fisica:monthly", {
    schema: "loja_fisica",
    fn: () => executeExternalQuery(`
      SELECT MONTH(DATA) as mes, DATE_FORMAT(DATA, '%b') as mes_nome, YEAR(DATA) as ano, SUM(VALOR_SUBT - VALOR_DESCONTO) as receita
      FROM loja_fisica.caixas_venda
      WHERE YEAR(DATA) >= YEAR(CURDATE()) - 1
      GROUP BY YEAR(DATA), MONTH(DATA), DATE_FORMAT(DATA, '%b')
      ORDER BY MONTH(DATA), YEAR(DATA)
    `, "loja_fisica")
  });

  fetchFunctions.set("comparison:loja_fisica:yearly", {
    schema: "loja_fisica",
    fn: () => executeExternalQuery(`
      SELECT YEAR(DATA) as ano, SUM(VALOR_SUBT - VALOR_DESCONTO) as receita
      FROM loja_fisica.caixas_venda
      WHERE YEAR(DATA) >= YEAR(CURDATE()) - 2
      GROUP BY YEAR(DATA)
      ORDER BY YEAR(DATA)
    `, "loja_fisica")
  });

  // Comparison - E-commerce
  fetchFunctions.set("comparison:db_gringao:monthly", {
    schema: "db_gringao",
    fn: () => executeExternalQuery(`
      SELECT MONTH(data) as mes, DATE_FORMAT(data, '%b') as mes_nome, YEAR(data) as ano, SUM(total) as receita
      FROM db_gringao.bling2_pedidos
      WHERE YEAR(data) >= YEAR(CURDATE()) - 1
      GROUP BY YEAR(data), MONTH(data), DATE_FORMAT(data, '%b')
      ORDER BY MONTH(data), YEAR(data)
    `, "db_gringao")
  });

  fetchFunctions.set("comparison:db_gringao:yearly", {
    schema: "db_gringao",
    fn: () => executeExternalQuery(`
      SELECT YEAR(data) as ano, SUM(total) as receita
      FROM db_gringao.bling2_pedidos
      WHERE YEAR(data) >= YEAR(CURDATE()) - 2
      GROUP BY YEAR(data)
      ORDER BY YEAR(data)
    `, "db_gringao")
  });

  // Executa pré-carregamento
  preloadCriticalCache(fetchFunctions).catch(error => {
    console.error('❌ Error preloading cache:', error);
  });

  // Pré-carrega produtos mais vendidos em background
  setTimeout(() => {
    preloadAllProducts().catch(error => {
      console.error('❌ Error preloading products:', error);
    });
  }, 5000); // Aguarda 5 segundos após o servidor iniciar

  // Configura backup incremental a cada 30 minutos
  setInterval(() => {
    console.log('\n🔄 Executando backup incremental...\n');
    incrementalBackup(fetchFunctions).catch(error => {
      console.error('❌ Error in incremental backup:', error);
    });
  }, 30 * 60 * 1000); // 30 minutos

  console.log('\n✅ Cache middleware configurado com sucesso!\n');
});

