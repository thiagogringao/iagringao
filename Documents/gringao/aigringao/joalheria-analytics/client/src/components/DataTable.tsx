import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatColumnName, formatNumberValue } from "@/lib/formatters";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { ImageWithTooltip } from "./ImageWithTooltip";

interface DataTableProps {
  data: any[];
}

export function DataTable({ data }: DataTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-neutral-500">
          Nenhum dado encontrado
        </CardContent>
      </Card>
    );
  }

  // Detecta se é uma comparação (tem estrutura label/period/data)
  const isComparison = data.length > 0 && 
    data[0].label !== undefined && 
    data[0].period !== undefined && 
    Array.isArray(data[0].data);

  if (isComparison) {
    return <ComparisonTable comparisonData={data} />;
  }

  const columns = Object.keys(data[0]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Dados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col}>{formatColumnName(col)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col}>
                      {renderCell(col, row[col])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonTable({ comparisonData }: { comparisonData: any[] }) {
  // Extrai todas as métricas únicas de todos os períodos
  const allMetrics = new Set<string>();
  comparisonData.forEach(period => {
    if (period.data && period.data.length > 0) {
      Object.keys(period.data[0]).forEach(key => allMetrics.add(key));
    }
  });

  const metrics = Array.from(allMetrics);

  // Verifica se há dados em algum período
  const hasAnyData = comparisonData.some(period => period.data && period.data.length > 0);

  // Funções de exportação
  const exportToCSV = () => {
    const headers = ['Período', ...metrics.map(m => formatColumnName(m))];
    const rows = comparisonData.map(period => {
      const periodData = period.data && period.data.length > 0 ? period.data[0] : {};
      return [
        period.label,
        ...metrics.map(metric => periodData[metric] ?? '-')
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comparacao_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    // Cria HTML de tabela para Excel
    const headers = ['Período', ...metrics.map(m => formatColumnName(m))];
    const rows = comparisonData.map(period => {
      const periodData = period.data && period.data.length > 0 ? period.data[0] : {};
      return [
        period.label,
        ...metrics.map(metric => periodData[metric] ?? '-')
      ];
    });

    let html = '<table><thead><tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';
    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => html += `<td>${cell}</td>`);
      html += '</tr>';
    });
    html += '</tbody></table>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comparacao_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
  };

  if (!hasAnyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparação entre Períodos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-neutral-500 mb-2">
              Não foram encontrados dados para os períodos solicitados.
            </p>
            <p className="text-sm text-neutral-400">
              Os períodos comparados podem não ter registros no banco de dados.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Comparação entre Períodos</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                {metrics.map((metric) => (
                  <TableHead key={metric}>{formatColumnName(metric)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData.map((period, i) => {
                const periodData = period.data && period.data.length > 0 ? period.data[0] : {};
                const hasData = period.data && period.data.length > 0;
                return (
                  <TableRow key={i} className={!hasData ? "bg-neutral-50" : ""}>
                    <TableCell className="font-semibold">
                      {period.label}
                      {!hasData && (
                        <span className="ml-2 text-xs text-neutral-400 font-normal">
                          (sem dados)
                        </span>
                      )}
                    </TableCell>
                    {metrics.map((metric) => (
                      <TableCell key={metric}>
                        {hasData ? renderCell(metric, periodData[metric]) : (
                          <span className="text-neutral-400 text-sm">-</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function renderCell(columnName: string, value: any): React.ReactNode {
  // Se for uma coluna de imagem, renderiza a imagem com tooltip
  if (
    columnName.toLowerCase().includes("imagem") ||
    columnName.toLowerCase().includes("image") ||
    columnName.toLowerCase() === "imageurl" ||
    columnName.toLowerCase() === "imagemurl" ||
    columnName.toLowerCase() === "img"
  ) {
    if (value && typeof value === "string" && value.startsWith("http")) {
      return (
        <ImageWithTooltip
          src={value}
          alt="Produto"
          className="h-16 w-16 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
          tooltipSize="md"
        />
      );
    }
    return <span className="text-neutral-400 text-xs">Sem imagem</span>;
  }

  // Se for número, usa formatação inteligente
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (typeof numValue === "number" && !isNaN(numValue)) {
    return formatNumberValue(columnName, value);
  }

  // Caso contrário, formata o valor normalmente
  return formatValue(value);
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return "-";
  return String(value);
}

