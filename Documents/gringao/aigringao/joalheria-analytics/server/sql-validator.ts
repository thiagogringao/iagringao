export interface SQLValidation {
  isValid: boolean;
  errors: string[];
  fixedSQL?: string;
}

export function validateAndFixSQL(sql: string): SQLValidation {
  const errors: string[] = [];
  let fixedSQL = sql;

  // Detecta se usa funções de agregação
  const hasAggregation = /\b(SUM|COUNT|AVG|MAX|MIN)\s*\(/i.test(sql);

  if (hasAggregation) {
    // Verifica se tem GROUP BY
    const hasGroupBy = /\bGROUP\s+BY\b/i.test(sql);

    if (!hasGroupBy) {
      // Extrai colunas não-agregadas do SELECT
      const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/is);
      if (selectMatch) {
        const selectClause = selectMatch[1];
        const columns = selectClause.split(",").map((c) => c.trim());

        const nonAggregatedColumns = columns.filter((col) => {
          return !/\b(SUM|COUNT|AVG|MAX|MIN)\s*\(/i.test(col);
        });

        if (nonAggregatedColumns.length > 0) {
          errors.push(
            `Colunas não-agregadas sem GROUP BY: ${nonAggregatedColumns.join(", ")}`
          );

          // Tenta corrigir removendo colunas não-agregadas
          const aggregatedOnly = columns.filter((col) =>
            /\b(SUM|COUNT|AVG|MAX|MIN)\s*\(/i.test(col)
          );

          if (aggregatedOnly.length > 0) {
            fixedSQL = sql.replace(
              /SELECT\s+(.*?)\s+FROM/is,
              `SELECT ${aggregatedOnly.join(", ")} FROM`
            );
            console.log("[SQL Validator] Auto-fixed SQL:", fixedSQL);
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    fixedSQL: errors.length > 0 ? fixedSQL : undefined,
  };
}

