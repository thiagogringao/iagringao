import mysql from "mysql2/promise";
import { getSchemaConfig, shouldUseBackup } from "./schema-config";

let externalConnection: mysql.Connection | null = null;
let backupConnection: mysql.Connection | null = null;

async function ensureConnection(schema?: string, useBackup: boolean = false): Promise<mysql.Connection> {
  // Se usar backup, cria conexão separada
  if (useBackup && schema) {
    const config = getSchemaConfig(schema);
    if (!config?.backupHost) {
      console.warn(`[External DB] ⚠️ Backup config not found for ${schema}, using primary DB`);
      return ensureConnection(schema, false);
    }

    if (!backupConnection) {
      console.log("[External DB] Creating backup connection...");
      backupConnection = await mysql.createConnection({
        host: config.backupHost!,
        port: config.backupPort!,
        user: config.backupUser!,
        password: config.backupPassword!,
        multipleStatements: false,
        connectTimeout: 10000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });
      console.log("[External DB] ✅ Backup connection established");
    }

    try {
      await backupConnection.ping();
    } catch (error) {
      console.log("[External DB] Backup connection lost, reconnecting...");
      backupConnection = await mysql.createConnection({
        host: config.backupHost!,
        port: config.backupPort!,
        user: config.backupUser!,
        password: config.backupPassword!,
        multipleStatements: false,
        connectTimeout: 10000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });
      console.log("[External DB] ✅ Backup reconnected successfully");
    }

    return backupConnection;
  }

  // Conexão principal
  if (!externalConnection) {
    console.log("[External DB] Creating new primary connection...");
    externalConnection = await mysql.createConnection({
      host: process.env.EXTERNAL_DB_HOST!,
      port: parseInt(process.env.EXTERNAL_DB_PORT!),
      user: process.env.EXTERNAL_DB_USER!,
      password: process.env.EXTERNAL_DB_PASSWORD!,
      multipleStatements: false,
      connectTimeout: 10000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
    console.log("[External DB] ✅ Primary connection established");
  }

  // Testa se a conexão está ativa
  try {
    await externalConnection.ping();
  } catch (error) {
    console.log("[External DB] Primary connection lost, reconnecting...");
    externalConnection = await mysql.createConnection({
      host: process.env.EXTERNAL_DB_HOST!,
      port: parseInt(process.env.EXTERNAL_DB_PORT!),
      user: process.env.EXTERNAL_DB_USER!,
      password: process.env.EXTERNAL_DB_PASSWORD!,
      multipleStatements: false,
      connectTimeout: 10000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
    console.log("[External DB] ✅ Primary reconnected successfully");
  }

  return externalConnection;
}


export async function executeExternalQuery(
  sql: string,
  schema: string
): Promise<any[]> {
  try {
    const useBackup = shouldUseBackup(schema);
    const conn = await ensureConnection(schema, useBackup);
    const dbType = useBackup ? 'BACKUP' : 'PRIMARY';

    // Força o schema
    await conn.query(`USE ${schema}`);

    console.log(`[External DB] Executing on ${schema} (${dbType}):`, sql);

    const [rows] = await conn.execute(sql);
    console.log(`[External DB] ✅ Query successful (${dbType}), ${(rows as any[]).length} rows returned`);
    return rows as any[];
  } catch (error: any) {
    console.error(`[External DB] ❌ Query failed on ${schema}:`, error.message);
    
    // Se erro de conexão, limpa a conexão para forçar reconexão na próxima tentativa
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || 
        error.code === 'ECONNRESET' || 
        error.fatal) {
      console.log("[External DB] Clearing dead connection...");
      if (shouldUseBackup(schema)) {
        backupConnection = null;
      } else {
        externalConnection = null;
      }
      
      // Tenta fallback: se backup falhou, tenta principal
      if (shouldUseBackup(schema)) {
        console.log("[External DB] ⚠️ Backup failed, trying primary DB as fallback...");
        try {
          const primaryConn = await ensureConnection(schema, false);
          await primaryConn.query(`USE ${schema}`);
          const [rows] = await primaryConn.execute(sql);
          console.log(`[External DB] ✅ Fallback to primary successful, ${(rows as any[]).length} rows returned`);
          return rows as any[];
        } catch (fallbackError: any) {
          console.error(`[External DB] ❌ Fallback also failed:`, fallbackError.message);
        }
      }
    }
    
    throw error;
  }
}

export async function getExternalConnection(schema?: string, useBackup: boolean = false) {
  return ensureConnection(schema, useBackup);
}

/**
 * Detecta os períodos (meses/anos) com dados disponíveis no schema
 */
export async function getAvailablePeriods(
  schema: string
): Promise<{ year: number; month: number; monthName: string }[]> {
  try {
    const useBackup = shouldUseBackup(schema);
    const conn = await ensureConnection(schema, useBackup);
    await conn.query(`USE ${schema}`);

    let sql: string;
    
    if (schema === "db_gringao") {
      // Para e-commerce, busca períodos na view vw_revenue (tem dados desde 2023)
      sql = `
        SELECT DISTINCT 
          YEAR(data) AS year,
          MONTH(data) AS month
        FROM db_gringao.vw_revenue
        WHERE data IS NOT NULL
        ORDER BY year DESC, month DESC
        LIMIT 12
      `;
    } else {
      // Para loja física, busca períodos na tabela de vendas
      sql = `
        SELECT DISTINCT 
          YEAR(DATA) AS year,
          MONTH(DATA) AS month
        FROM loja_fisica.caixas_venda
        WHERE DATA IS NOT NULL
        ORDER BY year DESC, month DESC
        LIMIT 12
      `;
    }

    console.log(`[External DB] Getting available periods for ${schema}`);
    const [rows] = await conn.execute(sql);
    
    const monthNames = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    
    const periods = (rows as any[]).map(row => ({
      year: row.year,
      month: row.month,
      monthName: monthNames[row.month - 1]
    }));
    
    console.log(`[External DB] ✅ Found ${periods.length} periods with data`);
    return periods;
  } catch (error: any) {
    console.error(`[External DB] ❌ Failed to get available periods:`, error.message);
    return [];
  }
}

