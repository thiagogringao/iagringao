import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import crypto from "crypto";
import { chatHistory, queryCache, queryMetrics } from "../drizzle/schema";
import { eq, lt, desc } from "drizzle-orm";

let db: any = null;

export async function getDb() {
  if (!db) {
    const sqlite = new Database('./joalheria_analytics.db');
    db = drizzle(sqlite);
  }
  return db;
}

// Salvar histórico de conversa
export async function saveChatHistory(data: {
  userId: number;
  sessionId: string;
  question: string;
  sqlQuery?: string;
  response?: string;
  schema?: string;
  executionTime?: number;
  success: boolean;
  errorMessage?: string;
}) {
  const database = await getDb();
  if (!database) return;

  await database.insert(chatHistory).values({
    userId: data.userId,
    sessionId: data.sessionId,
    question: data.question,
    sqlQuery: data.sqlQuery,
    response: data.response,
    schema: data.schema,
    executionTime: data.executionTime,
    success: data.success,
    errorMessage: data.errorMessage,
  });
}

// Buscar cache de query
export async function getCachedQuery(question: string, schema: string) {
  const database = await getDb();
  if (!database) return null;

  const hash = crypto.createHash("sha256").update(`${question}:${schema}`).digest("hex");

  const cached = await database
    .select()
    .from(queryCache)
    .where(eq(queryCache.questionHash, hash))
    .limit(1);

  if (cached.length === 0) return null;

  const item = cached[0];

  // Verifica se expirou
  if (new Date(item.expiresAt) < new Date()) {
    return null;
  }

  return item;
}

// Salvar cache de query
// IMPORTANTE: Como db_gringao é um backup incremental, o cache pode ter TTL maior
// Para dados em tempo real (loja_fisica), use TTL menor
export async function saveCachedQuery(data: {
  question: string;
  sqlQuery: string;
  schema: string;
  result: any;
}) {
  const database = await getDb();
  if (!database) return;

  const hash = crypto.createHash("sha256").update(`${data.question}:${data.schema}`).digest("hex");

  // Cache mais longo para backup incremental (db_gringao), mais curto para dados em tempo real (loja_fisica)
  const cacheDuration = data.schema === 'db_gringao' ? 7200000 : 1800000; // 2h vs 30min
  const expiresAt = new Date(Date.now() + cacheDuration);

  try {
    await database
      .insert(queryCache)
      .values({
        questionHash: hash,
        question: data.question,
        sqlQuery: data.sqlQuery,
        schema: data.schema,
        result: JSON.stringify(data.result),
        expiresAt,
      });
  } catch (error: any) {
    // Se já existe, atualiza
    if (error.code === 'ER_DUP_ENTRY') {
      // Nota: Drizzle não tem onDuplicateKeyUpdate por padrão, então vamos ignorar duplicatas
      console.log('[Cache] Entry already exists, skipping...');
    }
  }
}

// Salvar métricas
export async function saveQueryMetrics(data: {
  schema: string;
  executionTime: number;
  success: boolean;
  cached: boolean;
}) {
  const database = await getDb();
  if (!database) return;

  await database.insert(queryMetrics).values(data);
}

// Limpar cache expirado (executar periodicamente)
export async function cleanExpiredCache() {
  const database = await getDb();
  if (!database) return;

  await database.delete(queryCache).where(lt(queryCache.expiresAt, new Date()));
}

// Deletar cache específico por chave
export async function deleteCachedQuery(question: string, schema: string) {
  const database = await getDb();
  if (!database) return;

  const hash = crypto.createHash("sha256").update(`${question}:${schema}`).digest("hex");

  await database.delete(queryCache).where(eq(queryCache.questionHash, hash));
  console.log(`[Cache] Deleted cache for: ${question} (${schema})`);
}

// Deletar todos os caches de um schema
export async function deleteCacheBySchema(schema: string) {
  const database = await getDb();
  if (!database) return;

  await database.delete(queryCache).where(eq(queryCache.schema, schema));
  console.log(`[Cache] Deleted all cache for schema: ${schema}`);
}

// Obter histórico de chat
export async function getChatHistory(userId: number) {
  const database = await getDb();
  if (!database) return [];

  const history = await database
    .select()
    .from(chatHistory)
    .where(eq(chatHistory.userId, userId))
    .orderBy(desc(chatHistory.createdAt))
    .limit(20);

  return history;
}

// Deletar item do histórico
export async function deleteChatHistoryItem(id: number, userId: number) {
  const database = await getDb();
  if (!database) return;

  await database
    .delete(chatHistory)
    .where(eq(chatHistory.id, id))
    // Garante que o usuário só delete seu próprio histórico
    .where(eq(chatHistory.userId, userId));
}

