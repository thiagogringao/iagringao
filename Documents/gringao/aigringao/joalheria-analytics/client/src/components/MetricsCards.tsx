import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatLabel, formatNumberValue } from "@/lib/formatters";
import { ImageWithTooltip } from "./ImageWithTooltip";

interface MetricsCardsProps {
  data: any[];
}

function isImageColumn(columnName: string): boolean {
  return (
    columnName.toLowerCase().includes("imagem") ||
    columnName.toLowerCase().includes("image") ||
    columnName.toLowerCase() === "imageurl" ||
    columnName.toLowerCase() === "imagemurl" ||
    columnName.toLowerCase() === "img"
  );
}

function renderValue(key: string, value: any): React.ReactNode {
  // Se for uma coluna de imagem, renderiza a imagem com tooltip
  if (isImageColumn(key)) {
    if (value && typeof value === "string" && value.startsWith("http")) {
      return (
        <div className="flex justify-center">
          <ImageWithTooltip
            src={value}
            alt="Produto"
            className="h-32 w-32 object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
            tooltipSize="lg"
          />
        </div>
      );
    }
    return (
      <div className="text-neutral-400 text-sm text-center py-4">
        Sem imagem
      </div>
    );
  }

  // Para outras colunas, usa formatação normal
  return (
    <div className="text-3xl font-bold">
      {formatNumberValue(key, value)}
    </div>
  );
}

export function MetricsCards({ data }: MetricsCardsProps) {
  if (data.length === 0) return null;

  const firstRow = data[0];
  const metrics = Object.entries(firstRow);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map(([key, value]) => (
        <Card key={key}>
          <CardContent className="pt-6">
            <div className="text-sm text-neutral-500 mb-1 capitalize">
              {formatLabel(key)}
            </div>
            {renderValue(key, value)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

