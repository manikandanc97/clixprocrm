"use client";

import { CRMCard, EmptyState } from "@/shared/components/crm";
import { CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Users, ArrowUpRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useCustomers } from "@/shared/hooks/use-dashboard";
import { useRouter } from "next/navigation";
import { CustomerType, CustomersDataType } from "@/shared/types/customer";

export default function RecentCustomers({ data: initialData }: { data?: CustomersDataType }) {
  const router = useRouter();
  const { data: fetchedData, isLoading } = useCustomers();
  const data = initialData ?? fetchedData;
  // Ensure customers is an array and get the top 5 most recent based on createdAt if available, else just take first 5
  const allCustomers: CustomerType[] = Array.isArray(data?.customers) ? data.customers : (Array.isArray(data) ? data : []);
  const recentCustomers = [...allCustomers]
    .sort((a, b) => new Date(b.lastContactAt || 0).getTime() - new Date(a.lastContactAt || 0).getTime())
    .slice(0, 5);

  return (
    <div className="w-full h-full">
      <CRMCard animate={false} accentSeed="Recent Customers" noPadding className="h-full flex flex-col bg-gradient-to-br from-card to-background/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <CardTitle>Recent Customers</CardTitle>
          </div>
          <Button variant="ghost" onClick={() => router.push("/customers")} className="text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/10 rounded-xl px-4 h-9">View All</Button>
        </CardHeader>
        <CardContent className="pt-0 flex-1 flex flex-col">
          {recentCustomers.length === 0 && !isLoading ? (
            <EmptyState 
              icon={Users}
              title="No customers yet"
              description="Start converting leads into customers."
              className="border-none bg-transparent shadow-none"
            />
          ) : (
            <div className="space-y-5">
              {recentCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  style={{ animationDelay: `${100 + index * 50}ms` }}
                  className="group flex items-center justify-between cursor-pointer animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-both"
                  onClick={() => router.push("/customers")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground shadow-sm">
                      {customer.name?.charAt(0) || "C"}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{customer.name}</h4>
                      <p className="text-xs font-medium text-muted-foreground">{customer.company || customer.email || "No company"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="block text-xs font-medium text-muted-foreground">{customer.status}</span>
                    </div>
                    <button aria-label="View customer" className="opacity-0 group-hover:opacity-100 p-2 bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </CRMCard>
    </div>
  );
}
