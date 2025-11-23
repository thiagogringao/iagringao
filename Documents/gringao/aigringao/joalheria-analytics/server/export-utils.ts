import * as XLSX from 'xlsx';

/**
 * Exporta dados para formato TXT
 */
export function exportToTXT(data: any[], filename: string = 'export'): string {
  if (!data || data.length === 0) {
    return 'Nenhum dado disponível para exportar.';
  }

  const columns = Object.keys(data[0]);
  const maxWidths = columns.map(col => {
    const headerWidth = col.length;
    const maxDataWidth = Math.max(
      ...data.map(row => String(row[col] || '').length)
    );
    return Math.max(headerWidth, maxDataWidth, 10);
  });

  // Cabeçalho
  let output = columns
    .map((col, i) => col.padEnd(maxWidths[i] + 2))
    .join('| ')
    + '\n';

  // Separador
  output += columns
    .map((_, i) => '-'.repeat(maxWidths[i] + 2))
    .join('| ')
    + '\n';

  // Dados
  data.forEach(row => {
    output += columns
      .map((col, i) => String(row[col] || '').padEnd(maxWidths[i] + 2))
      .join('| ')
      + '\n';
  });

  return output;
}

/**
 * Exporta dados para formato Excel (XLSX)
 */
export function exportToExcel(
  data: any[],
  filename: string = 'export',
  sheetName: string = 'Dados'
): Buffer {
  if (!data || data.length === 0) {
    // Cria workbook vazio com mensagem
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['Nenhum dado disponível para exportar.']]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  // Converte dados para worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Ajusta largura das colunas
  const colWidths = Object.keys(data[0]).map(col => {
    const headerWidth = col.length;
    const maxDataWidth = Math.max(
      ...data.map(row => String(row[col] || '').length)
    );
    return { wch: Math.max(headerWidth, maxDataWidth, 10) };
  });
  ws['!cols'] = colWidths;

  // Cria workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Converte para buffer
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Exporta dados do dashboard para Excel com múltiplas abas
 */
export function exportDashboardToExcel(
  dashboardData: any[],
  comparisonData?: any[],
  schema: string = 'dashboard',
  period: string = 'monthly'
): Buffer {
  const wb = XLSX.utils.book_new();

  // Aba 1: Dados do Dashboard
  if (dashboardData && dashboardData.length > 0) {
    const ws1 = XLSX.utils.json_to_sheet(dashboardData);
    const colWidths1 = Object.keys(dashboardData[0]).map(col => {
      const headerWidth = col.length;
      const maxDataWidth = Math.max(
        ...dashboardData.map(row => String(row[col] || '').length)
      );
      return { wch: Math.max(headerWidth, maxDataWidth, 10) };
    });
    ws1['!cols'] = colWidths1;
    XLSX.utils.book_append_sheet(wb, ws1, 'Dashboard');
  }

  // Aba 2: Dados de Comparação (se houver)
  if (comparisonData && comparisonData.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(comparisonData);
    const colWidths2 = Object.keys(comparisonData[0]).map(col => {
      const headerWidth = col.length;
      const maxDataWidth = Math.max(
        ...comparisonData.map(row => String(row[col] || '').length)
      );
      return { wch: Math.max(headerWidth, maxDataWidth, 10) };
    });
    ws2['!cols'] = colWidths2;
    XLSX.utils.book_append_sheet(wb, ws2, 'Comparação');
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Gera nome de arquivo com timestamp
 */
export function generateFilename(
  prefix: string,
  schema?: string,
  period?: string,
  extension: string = 'xlsx'
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const schemaPart = schema ? `_${schema}` : '';
  const periodPart = period ? `_${period}` : '';
  return `${prefix}${schemaPart}${periodPart}_${timestamp}.${extension}`;
}

