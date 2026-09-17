"use client";

import { CRMCard, EmptyState } from "@/shared/components/crm";
import { CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Users, ArrowUpRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { cn } from "@/shared/lib/utils";
import { useCustomers } from "@/shared/hooks/use-dashboard";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { CustomerType, CustomersDataType } from "@/shared/types/customer";

export default function RecentCustomers({ data: initialData }: { data?: CustomersDataType }) {
  const router = useRouter();
  const { data: fetchedData, isLoading } = useCustomers();
  const data = initialData ?? fetchedData;
  
  const recentCustomers = useMemo(() => {
    const allCustomers: CustomerType[] = Array.isArray(data?.customers) ? data.customers : (Array.isArray(data) ? data : []);
    return [...allCustomers]
      .sort((a, b) => new Date(b.lastContactAt || 0).getTime() - new Date(a.lastContactAt || 0).getTime())
      .slice(0, 5);
  }, [data]);


  return (
    <div className="w-full h-full">
      <CRMCard animate={false} accentSeed="Recent Customers" noPadding className="h-full flex flex-col bg-gradient-to-br from-card to-background/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <CardTitle className="crm-type-h3 text-foreground">Recent Customers</CardTitle>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push("/customers")}
            className="text-primary font-semibold text-xs hover:bg-primary/10 rounded-lg px-3.5 h-8 cursor-pointer"
          >
            View All
          </Button>
        </CardHeader>
        <CardContent className="pt-0 flex-1 flex flex-col">
          {recentCustomers.length === 0 && !isLoading ? (
            <EmptyState 
              icon={Users}
              title="No customers yet"
              description="Start converting leads into customers."
              action={{ label: "Add Customer", onClick: () => router.push("/customers?new=true") }}
              className="border-none bg-transparent shadow-none"
            />
          ) : (
            <div className="space-y-4">
              {recentCustomers.map((customer, index) => {
                const color = getOrgAvatarColor(customer.name || "Customer");
                const statusVariant =
                  customer.status === "ACTIVE"
                    ? "emerald"
                    : customer.status === "PREMIUM"
                    ? "indigo"
                    : "neutral";

                return (
                  <div
                    key={customer.id}
                    style={{ animationDelay: `${100 + index * 50}ms` }}
                    className="group flex items-center justify-between cursor-pointer animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-both p-1.5 -mx-1.5 rounded-lg hover:bg-muted/40 transition-colors"
                    onClick={() => router.push("/customers")}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs border shrink-0",
                          color.bg,
                          color.text,
                          color.border
                        )}
                      >
                        {customer.name?.charAt(0).toUpperCase() || "C"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {customer.name}
                        </h4>
                        <p className="text-xs font-medium text-muted-foreground truncate">
                          {customer.company || customer.email || "No company"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={customer.status || "ACTIVE"} variant={statusVariant} />
                      <button
                        type="button"
                        aria-label="View customer"
                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-all cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </CRMCard>
    </div>
  );
}

