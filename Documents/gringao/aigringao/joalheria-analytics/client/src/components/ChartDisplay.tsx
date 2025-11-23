import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from "recharts";
import { Download, BarChart3 } from "lucide-react";
import { useRef } from "react";
import { formatChartValue } from "@/lib/formatters";

interface ChartDisplayProps {
  data: any[];
  type: "line" | "bar" | "pie";
}

const COLORS = ["#005A8C", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

// Componente customizado de Tooltip com formatação brasileira
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 border border-neutral-200 rounded-md shadow-lg">
      <p className="font-semibold text-sm mb-2">{label}</p>
      {payload.map((entry, index) => {
        const formattedValue = formatChartValue(entry.name || '', Number(entry.value) || 0);
        return (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>{" "}
            <span className="font-semibold">
              {formattedValue}
            </span>
          </p>
        );
      })}
    </div>
  );
};

export function ChartDisplay({ data, type }: ChartDisplayProps) {
  if (data.length === 0) return null;

  // Detecta se é uma comparação (tem estrutura label/period/data)
  const isComparison = data.length > 0 && 
    data[0].label !== undefined && 
    data[0].period !== undefined && 
    Array.isArray(data[0].data);

  if (isComparison) {
    return <ComparisonChart comparisonData={data} type={type} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Visualização</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {type === "line" && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={Object.keys(data[0])[0]} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey={Object.keys(data[0])[1]}
                stroke="#005A8C"
                strokeWidth={2}
              />
            </LineChart>
          )}
          {type === "bar" && (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={Object.keys(data[0])[0]} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey={Object.keys(data[0])[1]} fill="#005A8C" />
            </BarChart>
          )}
          {type === "pie" && (
            <PieChart>
              <Pie
                data={data}
                dataKey={Object.keys(data[0])[1]}
                nameKey={Object.keys(data[0])[0]}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ComparisonChart({ comparisonData, type }: { comparisonData: any[], type: "line" | "bar" | "pie" }) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Transforma os dados de comparação em formato adequado para gráficos
  const chartData = comparisonData.map(period => {
    const periodData = period.data && period.data.length > 0 ? period.data[0] : {};
    return {
      periodo: period.label,
      ...periodData
    };
  });

  if (chartData.length === 0) return null;

  // Pega todas as métricas (exceto 'periodo')
  const metrics = Object.keys(chartData[0]).filter(key => key !== 'periodo');

  // Função para exportar gráfico como imagem
  const exportChartAsImage = async () => {
    if (!chartRef.current) return;

    try {
      // Usa html2canvas para capturar o gráfico
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `grafico_comparacao_${new Date().toISOString().split('T')[0]}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Erro ao exportar gráfico:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Comparação entre Períodos</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={exportChartAsImage}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar PNG
        </Button>
      </CardHeader>
      <CardContent ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          {type === "bar" && (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {metrics.map((metric, index) => (
                <Bar 
                  key={metric} 
                  dataKey={metric} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </BarChart>
          )}
          {type === "line" && (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {metrics.map((metric, index) => (
                <Line 
                  key={metric}
                  type="monotone"
                  dataKey={metric} 
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          )}
          {type === "pie" && metrics.length > 0 && (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey={metrics[0]} fill="#005A8C" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

