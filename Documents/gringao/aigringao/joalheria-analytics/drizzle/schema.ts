import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Tabela de usuários
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  passwordHash: text("passwordHash"), // Hash da senha (bcrypt)
  role: text("role").notNull().default("user"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

// Histórico de conversas
export const chatHistory = sqliteTable("chat_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  sessionId: text("sessionId").notNull(),
  question: text("question").notNull(),
  sqlQuery: text("sqlQuery"),
  response: text("response"),
  schema: text("schema"),
  executionTime: integer("executionTime"),
  success: integer("success", { mode: "boolean" }).default(true),
  errorMessage: text("errorMessage"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Cache de queries
export const queryCache = sqliteTable("query_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionHash: text("questionHash").notNull().unique(),
  question: text("question").notNull(),
  sqlQuery: text("sqlQuery").notNull(),
  schema: text("schema").notNull(),
  result: text("result").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Métricas de performance
export const queryMetrics = sqliteTable("query_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schema: text("schema").notNull(),
  executionTime: integer("executionTime").notNull(),
  success: integer("success", { mode: "boolean" }).default(true),
  cached: integer("cached", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type ChatHistory = typeof chatHistory.$inferSelect;
export type QueryCache = typeof queryCache.$inferSelect;
export type QueryMetrics = typeof queryMetrics.$inferSelect;
