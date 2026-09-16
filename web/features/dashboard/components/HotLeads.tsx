"use client";

import { CRMCard, EmptyState } from "@/shared/components/crm";
import { CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Flame, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useHotLeads } from "@/shared/hooks/use-dashboard";
import { useCurrency } from "@/shared/hooks/use-currency";
import { useRouter } from "next/navigation";

export default function HotLeads() {
  const router = useRouter();
  const { data } = useHotLeads();
  const leads = data?.leads ?? [];
  const { formatCurrency } = useCurrency();

  return (
    <div className="w-full h-full">
      <CRMCard animate={false} accentSeed="Hot Leads" noPadding className="h-full flex flex-col bg-gradient-to-br from-card to-background/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 text-warning rounded-xl">
              <Flame className="w-5 h-5" />
            </div>
            <CardTitle>Hot Leads</CardTitle>
          </div>
          <Button variant="ghost" onClick={() => router.push("/leads")} className="text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/10 rounded-xl px-4 h-9">View All</Button>
        </CardHeader>
        <CardContent className="pt-0 flex-1 flex flex-col">
          {leads.length === 0 ? (
            <EmptyState 
              icon={Flame}
              title="No hot leads"
              description="Keep prospecting to find hot opportunities."
              action={{ label: "Add Lead", onClick: () => router.push("/leads?new=true") }}
              className="border-none bg-transparent shadow-none"
            />
          ) : (
            <div className="space-y-5">
              {leads.map((lead, index) => (
                <div
                  key={lead.id}
                  style={{ animationDelay: `${100 + index * 50}ms` }}
                  className="group flex items-center justify-between animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-both"
                >
                  <div className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground shadow-sm">
                        {lead.name.charAt(0)}
                      </div>
                      {lead.score > 90 && (
                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground group-hover:text-warning transition-colors">{lead.name}</h4>
                      <p className="text-xs font-medium text-muted-foreground">{lead.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="block font-bold text-foreground text-sm">{formatCurrency(Number(String(lead.value).replace(/[^0-9.-]+/g,"")))}</span>
                      <span className="text-[10px] font-bold text-warning flex items-center gap-0.5">
                        <Flame className="w-3 h-3" /> {lead.score} Score
                      </span>
                    </div>
                    <button aria-label="View lead" className="opacity-0 group-hover:opacity-100 p-2 bg-muted hover:bg-warning/10 text-muted-foreground hover:text-warning rounded-xl transition-all">
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












