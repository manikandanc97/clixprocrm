"use client";

import React from "react";
import { Mail, Phone, MoreVertical, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Badge } from "@/shared/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";
import { StatusBadge, StatusVariant } from "@/shared/components/StatusBadge";
import { LeadType, LeadStatus } from "@/shared/types/lead";
import { formatCurrency } from "@/shared/utils/formatters";
import { cn } from "@/shared/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface LeadMobileCardsProps {
  leads: LeadType[];
  selectedIds: string[];
  statusVariantMap: Record<string, StatusVariant>;
  getPriorityColor: (p?: string) => string;
  isOverdue: (date?: string | null) => boolean;
  onToggleSelect: (id: string) => void;
  onEditLead: (lead: LeadType) => void;
  onConvertLead: (lead: LeadType) => void;
  onStageTransitionLead: (lead: LeadType) => void;
  onCreateTask: (lead: LeadType) => void;
  onScheduleMeeting: (lead: LeadType) => void;
  onDeleteLead: (lead: LeadType) => void;
  onAction: (e: React.MouseEvent, type: string, target: string, lead?: LeadType) => void;
}

export function LeadMobileCards({
  leads,
  selectedIds,
  statusVariantMap,
  getPriorityColor,
  isOverdue,
  onToggleSelect,
  onEditLead,
  onConvertLead,
  onStageTransitionLead,
  onCreateTask,
  onScheduleMeeting,
  onDeleteLead,
  onAction,
}: LeadMobileCardsProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden flex-auto overflow-y-auto pr-1">
      {leads.map((lead) => (
        <div key={lead.id} className="bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all duration-200 p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.includes(lead.id)}
                onCheckedChange={() => onToggleSelect(lead.id)}
              />
              <Avatar className="w-10 h-10 rounded-full border shadow-sm">
                <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                  {lead.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm text-foreground">{lead.name}</p>
                <p className="text-xs text-muted-foreground font-medium">{lead.company}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditLead(lead); }}>
                  Edit Lead
                </DropdownMenuItem>

                {lead.stage === LeadStatus.WON && (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        if (lead.customerId) router.push(`/customers/${lead.customerId}`);
                        else toast.error("Customer ID not found");
                      }}
                    >
                      View Customer
                    </DropdownMenuItem>
                    {lead.isConverted && (
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onConvertLead(lead); }}
                        className="text-emerald-600 focus:text-emerald-700 font-medium"
                      >
                        View Deal Conversion
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {lead.stage === LeadStatus.LOST ? (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStageTransitionLead(lead); }}>
                    Reopen Lead
                  </DropdownMenuItem>
                ) : lead.stage !== LeadStatus.WON ? (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onConvertLead(lead); }}
                      className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950 font-medium"
                    >
                      Convert to Deal
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStageTransitionLead(lead); }}>
                      Move Stage
                    </DropdownMenuItem>
                  </>
                ) : null}

                <DropdownMenuSeparator />

                {lead.stage !== LeadStatus.LOST && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateTask(lead); }}>
                    Create Task
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onScheduleMeeting(lead); }}>
                  Schedule Meeting
                </DropdownMenuItem>

                {lead.stage !== LeadStatus.LOST && (
                  <>
                    <DropdownMenuItem onClick={(e) => onAction(e, "Email Draft", lead.name, lead)}>
                      Send Email
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => onAction(e, "Call Initiated", lead.name, lead)}>
                      Call
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteLead(lead); }} variant="destructive">
                  Delete Lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Stage</span>
              <div>
                <StatusBadge status={lead.status} variant={statusVariantMap[lead.stage] || "slate"} />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Value</span>
              <p className="text-sm font-bold text-foreground">
                {lead.valueAmount
                  ? formatCurrency(lead.valueAmount)
                  : formatCurrency(Number(String(lead.value).replace(/[^0-9.-]+/g, "")))}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Priority</span>
              <div>
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getPriorityColor(lead.priority))}>
                  {lead.priority || "Low"}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Next Follow-up</span>
              {lead.stage === LeadStatus.WON ? (
                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                </p>
              ) : (
                <p className={cn("text-xs font-medium", isOverdue(lead.followUpAt) ? "text-rose-600" : "text-foreground")}>
                  {lead.followUp}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 h-9 text-xs"
              onClick={(e) => onAction(e, "Email Draft", lead.name, lead)}
            >
              <Mail className="w-3.5 h-3.5" /> Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 h-9 text-xs"
              onClick={(e) => onAction(e, "Call Initiated", lead.name, lead)}
            >
              <Phone className="w-3.5 h-3.5" /> Call
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
