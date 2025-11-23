import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImageWithTooltipProps {
  src: string;
  alt?: string;
  className?: string;
  tooltipSize?: "sm" | "md" | "lg";
}

export function ImageWithTooltip({
  src,
  alt = "Produto",
  className = "h-16 w-16 object-cover rounded-md",
  tooltipSize = "md",
}: ImageWithTooltipProps) {
  const sizeClasses = {
    sm: "max-w-xs w-64",
    md: "max-w-md w-96",
    lg: "max-w-2xl w-[600px]",
  };

  const placeholderSrc =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3ESem imagem%3C/text%3E%3C/svg%3E";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-pointer inline-block">
            <img
              src={src}
              alt={alt}
              className={className}
              onError={(e) => {
                (e.target as HTMLImageElement).src = placeholderSrc;
              }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={10}
          className={`${sizeClasses[tooltipSize]} p-3 bg-white border-2 border-neutral-300 shadow-2xl z-[9999]`}
        >
          <img
            src={src}
            alt={alt}
            className="w-full h-auto rounded-md max-h-[500px] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = placeholderSrc;
            }}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

