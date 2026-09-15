"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useCurrency } from "@/shared/hooks/use-currency";
import { LineItemState, ItemCalculation } from "./invoice-types";

interface InvoiceLineItemsTableProps {
  items: LineItemState[];
  currency: string;
  itemCalculations: ItemCalculation[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: <K extends keyof LineItemState>(index: number, field: K, value: LineItemState[K]) => void;
}

export function InvoiceLineItemsTable({
  items,
  currency,
  itemCalculations,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: InvoiceLineItemsTableProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Invoice Items</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddItem}
          className="gap-1.5 text-xs h-8 font-semibold"
        >
          <Plus className="w-3.5 h-3.5 text-primary" /> Add Item
        </Button>
      </div>

      <div className="border border-border/80 rounded-xl overflow-x-auto overflow-y-hidden shadow-xs">
        <table className="w-full text-xs">
          <thead className="bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 text-foreground font-bold">
            <tr className="h-10">
              <th className="py-2 px-3 text-left w-[36%] border-r border-emerald-500/15">Item & Description</th>
              <th className="py-2 px-2 text-center w-[12%] border-r border-emerald-500/15">Qty / Unit</th>
              <th className="py-2 px-2 text-right w-[16%] border-r border-emerald-500/15">Unit Price (₹)</th>
              <th className="py-2 px-2 text-right w-[12%] border-r border-emerald-500/15">Disc %</th>
              <th className="py-2 px-2 text-right w-[10%] border-r border-emerald-500/15">GST %</th>
              <th className="py-2 px-3 text-right w-[14%] border-r border-emerald-500/15">Total</th>
              <th className="py-2 px-2 w-[4%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((item, idx) => {
              const itemCalc = itemCalculations[idx];
              return (
                <tr key={item.id} className="bg-card hover:bg-muted/10 transition-colors">
                  <td className="p-2.5 space-y-1">
                    <Input
                      placeholder="Product or Service Name"
                      value={item.name}
                      onChange={(e) => onUpdateItem(idx, "name", e.target.value)}
                      className="h-8 text-xs font-semibold"
                      aria-label={`Item name, row ${idx + 1}`}
                    />
                    <Input
                      placeholder="Description (Optional)"
                      value={item.description}
                      onChange={(e) => onUpdateItem(idx, "description", e.target.value)}
                      className="h-7 text-[11px] text-muted-foreground"
                      aria-label={`Item description, row ${idx + 1}`}
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1 items-center">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => onUpdateItem(idx, "quantity", Number(e.target.value) || 0)}
                        className="h-8 text-xs text-center px-1"
                        aria-label={`Quantity, row ${idx + 1}`}
                      />
                      <Input
                        placeholder="unit"
                        value={item.unit}
                        onChange={(e) => onUpdateItem(idx, "unit", e.target.value)}
                        className="h-8 text-[11px] text-center w-14 px-1"
                        aria-label={`Unit, row ${idx + 1}`}
                      />
                    </div>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => onUpdateItem(idx, "unitPrice", Number(e.target.value) || 0)}
                      className="h-8 text-xs text-right font-mono"
                      aria-label={`Unit price, row ${idx + 1}`}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discountValue}
                      onChange={(e) => onUpdateItem(idx, "discountValue", Number(e.target.value) || 0)}
                      className="h-8 text-xs text-right"
                      aria-label={`Discount, row ${idx + 1}`}
                    />
                  </td>
                  <td className="p-2">
                    <Select
                      value={String(item.taxRate)}
                      onValueChange={(val) => onUpdateItem(idx, "taxRate", Number(val))}
                    >
                      <SelectTrigger className="h-8 text-xs text-right" aria-label={`Tax rate, row ${idx + 1}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0" className="text-xs">0%</SelectItem>
                        <SelectItem value="5" className="text-xs">5%</SelectItem>
                        <SelectItem value="12" className="text-xs">12%</SelectItem>
                        <SelectItem value="18" className="text-xs">18%</SelectItem>
                        <SelectItem value="28" className="text-xs">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-foreground">
                    {formatCurrency(itemCalc?.lineTotal || 0, currency)}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(idx)}
                      aria-label="Delete line item"
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
