"use client";

import * as React from "react";
import { Rows2, Rows3, Rows4 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { cn } from "@/shared/lib/utils";

export type TableDensity = "compact" | "default" | "comfortable";

export interface DataTableDensityToggleProps {
  density: TableDensity;
  onDensityChange: (density: TableDensity) => void;
  className?: string;
}

export function DataTableDensityToggle({
  density,
  onDensityChange,
  className,
}: DataTableDensityToggleProps) {
  const options: { value: TableDensity; label: string; icon: typeof Rows3; desc: string }[] = [
    { value: "compact", label: "Compact", icon: Rows4, desc: "Dense row height (44px)" },
    { value: "default", label: "Default", icon: Rows3, desc: "Standard row height (56px)" },
    { value: "comfortable", label: "Comfortable", icon: Rows2, desc: "Spacious row height (64px)" },
  ];

  const currentOption = options.find((o) => o.value === density) || options[1];
  const CurrentIcon = currentOption.icon;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("h-9 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground", className)}
              aria-label="Change table density"
            >
              <CurrentIcon className="size-3.5" />
              <span className="hidden sm:inline">{currentOption.label}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Table Density
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-44 p-1">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = opt.value === density;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onDensityChange(opt.value)}
              className={cn(
                "flex items-center gap-2 text-xs py-2 px-2.5 rounded-md cursor-pointer",
                isSelected && "bg-muted font-medium text-foreground"
              )}
            >
              <Icon className={cn("size-3.5", isSelected ? "text-primary" : "text-muted-foreground")} />
              <div className="flex flex-col">
                <span>{opt.label}</span>
                <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
