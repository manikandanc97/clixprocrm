"use client";

import React from "react";
import { Crown, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { TopCustomerType } from "@/shared/types/report";
import { motion } from "framer-motion";
import { useCurrency } from "@/shared/hooks/use-currency";
import { AppIcon } from "@/shared/components/icons/icon-registry";

interface TopCustomersProps {
  data: TopCustomerType[];
  loading?: boolean;
}

const TopCustomers = ({ data }: TopCustomersProps) => {
  const { formatCurrency } = useCurrency();

  const safeData = Array.isArray(data) ? data : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className="h-full flex flex-col min-w-0"
    >
      <Card className="bg-card rounded-2xl border-border/80 shadow-xs overflow-hidden h-full flex flex-col flex-1">
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110">
              <AppIcon name="topCustomers" icon={Crown} size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="font-bold text-foreground text-base tracking-tight">Top Customers</CardTitle>
              <CardDescription className="text-muted-foreground text-xs mt-0.5">Highest revenue generating clients</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0 min-w-0 flex-1 overflow-y-auto">
          {safeData.length === 0 ? (
            <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-4">
              <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-2">
                <Users className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-xs font-semibold text-foreground">No customers yet</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Win deals to see top revenue clients here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {safeData.slice(0, 5).map((customer, index) => (
                <div key={customer.id || index} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {customer.name || customer.company || `Customer ${index + 1}`}
                    </p>
                    <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                      {formatCurrency(customer.revenue || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default React.memo(TopCustomers);

