import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatColumnName } from "@/lib/formatters";
import { ImageWithTooltip } from "./ImageWithTooltip";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableTableProps {
  data: any[];
  sortColumn?: string;
  sortDirection?: "asc" | "desc" | null;
  onSort?: (column: string) => void;
}

export function SortableTable({ data, sortColumn, sortDirection, onSort }: SortableTableProps) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-neutral-500">
        Nenhum dado encontrado
      </div>
    );
  }

  const columns = Object.keys(data[0]).filter(
    (key) => !key.startsWith("_") // Remove campos internos
  );

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    if (sortDirection === "asc") return <ArrowUp className="w-3 h-3 ml-1 inline" />;
    if (sortDirection === "desc") return <ArrowDown className="w-3 h-3 ml-1 inline" />;
    return null;
  };

  const isImageColumn = (columnName: string) => {
    return /imagem|image|img|foto|photo/i.test(columnName);
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column}
                className={cn(
                  "cursor-pointer select-none hover:bg-neutral-100 transition-colors",
                  sortColumn === column && "bg-neutral-100"
                )}
                onClick={() => onSort?.(column)}
              >
                <div className="flex items-center">
                  {formatColumnName(column)}
                  {getSortIcon(column)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => {
                const value = row[column];
                const isImage = isImageColumn(column);

                return (
                  <TableCell key={column}>
                    {isImage && value ? (
                      <ImageWithTooltip src={value} alt={row.nome_descricao || "Produto"} />
                    ) : (
                      <span>{value ?? "-"}</span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

