import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Database, FileSpreadsheet, FileText } from "lucide-react";
import { DataTable } from "./DataTable";
import { ChartDisplay } from "./ChartDisplay";
import { MetricsCards } from "./MetricsCards";
import ReactMarkdown from "react-markdown";
import { trpc } from "@/lib/trpc";
import { downloadFile } from "@/lib/download-utils";

interface ResultsDisplayProps {
  results: {
    naturalAnswer: string;
    data: any[];
    sqlQuery: string;
    executionTime: number;
    visualizationType: "card" | "table" | "chart";
    chartType?: "line" | "bar" | "pie";
    schema: string;
    insights?: string[];
  };
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  // Mutation para exportar query
  const exportQueryMutation = trpc.analytics.exportQuery.useMutation();

  // Função para exportar dados da query
  const handleExport = async (format: "xlsx" | "txt") => {
    try {
      if (!results.data || results.data.length === 0) {
        alert("Nenhum dado disponível para exportar.");
        return;
      }

      const result = await exportQueryMutation.mutateAsync({
        data: results.data,
        format,
        filename: `query_${new Date().toISOString().slice(0, 10)}.${format}`,
      });

      if (result.success && result.data && result.filename) {
        downloadFile(result.data, result.filename, result.mimeType);
      }
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao exportar dados. Tente novamente.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Resposta Natural */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Resposta</CardTitle>
          {results.data && results.data.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleExport("xlsx")}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleExport("txt")}
              >
                <FileText className="w-4 h-4" />
                TXT
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{results.naturalAnswer}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {results.insights && results.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#005A8C]">•</span>
                  <span className="text-sm">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Visualização de Dados */}
      {results.visualizationType === "card" && <MetricsCards data={results.data} />}
      {results.visualizationType === "table" && <DataTable data={results.data} />}
      {results.visualizationType === "chart" && results.chartType && (
        <ChartDisplay data={results.data} type={results.chartType} />
      )}

      {/* Detalhes Técnicos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="w-4 h-4" />
            Detalhes Técnicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">{results.schema}</Badge>
            <span className="text-neutral-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {results.executionTime}ms
            </span>
          </div>
          <div className="bg-neutral-100 p-3 rounded-md">
            <code className="text-xs font-mono">{results.sqlQuery}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

