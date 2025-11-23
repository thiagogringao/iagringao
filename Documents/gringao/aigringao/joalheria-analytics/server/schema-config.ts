/**
 * Configuração de Schemas com Backup
 * 
 * Define quais schemas usam backup e quais usam banco principal
 * 
 * Schemas disponíveis:
 * - db_gringao: E-commerce (usa backup - dados históricos)
 * - loja_fisica: Loja Física (usa principal - dados em tempo real)
 */

export interface SchemaConfig {
  name: string;
  useBackup: boolean;
  backupHost?: string;
  backupPort?: number;
  backupUser?: string;
  backupPassword?: string;
  description?: string;
}

/**
 * Configuração dos 2 schemas disponíveis
 */
export const SCHEMA_CONFIGS: Record<string, SchemaConfig> = {
  // Schema com backup (dados históricos)
  db_gringao: {
    name: 'db_gringao',
    useBackup: true,
    backupHost: process.env.BACKUP_DB_HOST || process.env.EXTERNAL_DB_HOST,
    backupPort: parseInt(process.env.BACKUP_DB_PORT || process.env.EXTERNAL_DB_PORT || '3306'),
    backupUser: process.env.BACKUP_DB_USER || process.env.EXTERNAL_DB_USER,
    backupPassword: process.env.BACKUP_DB_PASSWORD || process.env.EXTERNAL_DB_PASSWORD,
    description: 'E-commerce - Backup incremental (dados históricos)',
  },
  
  // Schema com banco principal (dados em tempo real)
  loja_fisica: {
    name: 'loja_fisica',
    useBackup: false,
    description: 'Loja Física - Dados em tempo real (PDV)',
  },
};

/**
 * Obtém configuração de um schema
 */
export function getSchemaConfig(schema: string): SchemaConfig | null {
  return SCHEMA_CONFIGS[schema] || null;
}

/**
 * Verifica se schema usa backup
 */
export function shouldUseBackup(schema: string): boolean {
  const config = getSchemaConfig(schema);
  return config?.useBackup || false;
}

/**
 * Lista todos os schemas disponíveis
 */
export function getAllSchemas(): string[] {
  return Object.keys(SCHEMA_CONFIGS);
}

/**
 * Lista schemas que usam backup
 */
export function getBackupSchemas(): string[] {
  return Object.values(SCHEMA_CONFIGS)
    .filter(config => config.useBackup)
    .map(config => config.name);
}

/**
 * Lista schemas que usam banco principal
 */
export function getPrimarySchemas(): string[] {
  return Object.values(SCHEMA_CONFIGS)
    .filter(config => !config.useBackup)
    .map(config => config.name);
}

