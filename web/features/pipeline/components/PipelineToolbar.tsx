import { useState } from "react";
import { Search, Filter, ArrowUpDown, X } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface PipelineToolbarProps {
  onSearch: (value: string) => void;
  onSort: (value: string) => void;
  onFilter: (value: string) => void;
  className?: string;
}

export function PipelineToolbar({ onSearch, onSort, onFilter, className }: PipelineToolbarProps) {
  return null;
}
