"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { ArrowUpRight, TrendingUp, Users } from "lucide-react";
import { PerformanceType } from "@/shared/types/report";
import { 
  CRMDataTable, 
  CRMTableHeader, 
  CRMTableBody, 
  CRMTableRow, 
  CRMTableCell, 
  CRMTableHeaderCell,
} from "@/shared/components/crm";
import { useCurrency } from "@/shared/hooks/use-currency";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { motion } from "framer-motion";
import { AppIcon } from "@/shared/components/icons/icon-registry";

interface PerformanceTableProps {
  performance: PerformanceType[];
  onViewAll?: () => void;
}

const PerformanceTable = ({ performance, onViewAll }: PerformanceTableProps) => {
  const { formatCurrency } = useCurrency();

  const safeData = Array.isArray(performance) ? performance : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="w-full flex flex-col"
    >
      <Card className="bg-card rounded-2xl border-border/80 shadow-xs overflow-hidden w-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110">
              <AppIcon name="team" icon={Users} size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="font-bold text-foreground text-base tracking-tight">Team Performance</CardTitle>
              <CardDescription className="text-muted-foreground text-xs mt-0.5">
                Detailed breakdown of sales representatives
              </CardDescription>
            </div>
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer transition-colors"
            >
              View all
            </button>
          )}
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <CRMDataTable containerClassName="border-0 shadow-none rounded-none w-full" className="w-full">
            <CRMTableHeader className="bg-muted/30 border-b border-border/60">
              <CRMTableRow className="h-9 hover:bg-transparent">
                <CRMTableHeaderCell className="text-xs font-semibold text-muted-foreground pl-5">
                  Team Member
                </CRMTableHeaderCell>
                <CRMTableHeaderCell className="text-xs font-semibold text-muted-foreground">
                  Deals Closed
                </CRMTableHeaderCell>
                <CRMTableHeaderCell className="text-xs font-semibold text-muted-foreground">
                  Revenue
                </CRMTableHeaderCell>
                <CRMTableHeaderCell className="text-xs font-semibold text-muted-foreground">
                  Conversion
                </CRMTableHeaderCell>
                <CRMTableHeaderCell className="text-xs font-semibold text-muted-foreground pr-5 text-right">
                  Trend
                </CRMTableHeaderCell>
              </CRMTableRow>
            </CRMTableHeader>

            <CRMTableBody>
              {safeData.length === 0 ? (
                <CRMTableRow>
                  <CRMTableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-1">
                      <Users className="h-6 w-6 text-muted-foreground/50" />
                      <p className="text-xs font-medium text-foreground">No team members recorded</p>
                    </div>
                  </CRMTableCell>
                </CRMTableRow>
              ) : (
                safeData.slice(0, 5).map((item) => (
                  <CRMTableRow key={item.id} className="hover:bg-muted/30 transition-colors h-14">
                    <CRMTableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 rounded-full border border-border/80 bg-muted flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                          <AvatarFallback className="bg-muted text-foreground">
                            {item.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground text-xs truncate">{item.name || "Member"}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                            Sales Representative
                          </p>
                        </div>
                      </div>
                    </CRMTableCell>

                    <CRMTableCell>
                      <span className="text-xs font-bold text-foreground">{item.dealsClosed}</span>
                    </CRMTableCell>

                    <CRMTableCell>
                      <span className="text-xs font-bold text-foreground">
                        {formatCurrency(item.revenueValue || 0)}
                      </span>
                    </CRMTableCell>

                    <CRMTableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {item.conversionRate || "0%"}
                      </span>
                    </CRMTableCell>

                    <CRMTableCell className="pr-5 text-right">
                      <div className="flex items-center justify-end gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{item.trend || "0%"}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </CRMTableCell>
                  </CRMTableRow>
                ))
              )}
            </CRMTableBody>
          </CRMDataTable>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default React.memo(PerformanceTable);

