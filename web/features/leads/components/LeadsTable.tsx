"use client";

import { 
  Mail, 
  Phone, 
  MoreVertical, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Calendar, 
  User,
  Trash2,
  CheckCircle2,
  Edit2,
  RefreshCw
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useCurrency } from "@/shared/hooks/use-currency";
import { useUpdateLead } from "@/shared/hooks/use-crm";
import { LEAD_STATUS_LABELS } from "@/lib/crm-formatters";
import { useRouter } from "next/navigation";
import { WonLostSubmitData } from "@/features/pipeline/components/WonLostModal";
import { LeadBulkActionToolbar } from "./LeadBulkActionToolbar";
import { LeadMobileCards } from "./LeadMobileCards";
import { LeadModalsHost } from "./LeadModalsHost";


import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/shared/ui/dropdown-menu";
import { LeadType, LeadStatus } from "@/shared/types/lead";
import { Checkbox } from "@/shared/ui/checkbox";
import { DataTable } from "@/shared/components/DataTable";
import { StatusBadge, StatusVariant } from "@/shared/components/StatusBadge";
import { CRMPagination } from "@/shared/components/crm";
import { cn } from "@/shared/lib/utils";
import { useLeads } from "../hooks/useLeads";
import { Badge } from "@/shared/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { LeadEmptyState } from "./LeadEmptyState";
import { DataTableColumnHeader } from "@/shared/components/DataTableColumnHeader";

interface LeadsTableProps {
  leads: LeadType[];
  totalCount: number;
  rawTotalCount?: number;
  globalSearchQuery?: string;
  globalStatusFilter?: string;
  onActiveFiltersChange?: (hasFilters: boolean) => void;
  onClearFilters?: (clearFn: () => void) => void;
  onGlobalClearFilters?: () => void;
  onAddLead?: () => void;
  onImport?: () => void;
}

const statusVariantMap: Record<string, StatusVariant> = {
  [LeadStatus.NEW]: "blue",
  [LeadStatus.CONTACTED]: "amber",
  [LeadStatus.PROPOSAL_SENT]: "indigo",
  [LeadStatus.WON]: "emerald",
  [LeadStatus.LOST]: "rose",
};

const getPriorityColor = (p?: string) => {
  if (!p) return "bg-muted text-muted-foreground border-border";
  switch (p.toUpperCase()) {
    case "URGENT": return "bg-purple-500/10 text-purple-700 border-purple-500/25";
    case "HIGH": return "bg-rose-500/10 text-rose-700 border-rose-500/25";
    case "MEDIUM": return "bg-amber-500/10 text-amber-700 border-amber-500/25";
    case "LOW": return "bg-blue-500/10 text-blue-700 border-blue-500/25";
    default: return "bg-muted text-muted-foreground border-border";
  }
};

// Helper for follow-up date check
const isOverdue = (dateStr: string | null | undefined) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};


const LeadsTable = ({ 
  leads, 
  totalCount: _totalCount,
  rawTotalCount,
  globalSearchQuery,
  globalStatusFilter,
  onActiveFiltersChange, 
  onClearFilters,
  onGlobalClearFilters,
  onAddLead,
  onImport
}: LeadsTableProps) => {
  const {
    sortedLeads,
    selectedIds,
    setSelectedIds,
    handleSort,
    setSort,
    sortConfig,
    filters,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    toggleSelectAll,
    toggleSelect,
    handleDelete,
    handleBulkDelete,
    isDeletingBulk,
  } = useLeads(leads);

  useEffect(() => {
    onActiveFiltersChange?.(hasActiveFilters);
  }, [hasActiveFilters, onActiveFiltersChange]);

  useEffect(() => {
    if (onClearFilters) {
      onClearFilters(() => clearFilters);
    }
  }, [clearFilters, onClearFilters]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(sortedLeads.length / rowsPerPage);
  const paginatedLeads = sortedLeads.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const [editingLead, setEditingLead] = useState<LeadType | null>(null);
  const [taskLead, setTaskLead] = useState<LeadType | null>(null);
  const [meetingLead, setMeetingLead] = useState<LeadType | null>(null);
  const [customerLead, setCustomerLead] = useState<LeadType | null>(null);
  const [deletingLead, setDeletingLead] = useState<LeadType | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [stageTransitionLead, setStageTransitionLead] = useState<LeadType | null>(null);
  const [addNoteLead, setAddNoteLead] = useState<string | null>(null);
  const [detailsLeadId, setDetailsLeadId] = useState<string | null>(null);
  const [convertLead, setConvertLead] = useState<LeadType | null>(null);
  
  const [confirmMoveModal, setConfirmMoveModal] = useState<{ isOpen: boolean; deal: ReturnType<typeof JSON.parse>; targetStage: string | null; originalStage: string | null }>({ isOpen: false, deal: null, targetStage: null, originalStage: null });
  const [wonLostModal, setWonLostModal] = useState<{ isOpen: boolean; type: LeadStatus.WON | LeadStatus.LOST | null; deal: ReturnType<typeof JSON.parse>; originalStage: string | null }>({ isOpen: false, type: null, deal: null, originalStage: null });

  const { mutate: updateLeadMutate, isPending: isUpdating } = useUpdateLead();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { formatCurrency } = useCurrency();

  const handleStageChange = (lead: LeadType, targetStage: string) => {
    const originalStage = lead.stage;
    const deal = { ...lead, stage: originalStage };
    
    if (targetStage === LeadStatus.LOST || targetStage === LeadStatus.WON) {
      setWonLostModal({
        isOpen: true,
        type: targetStage as LeadStatus.WON | LeadStatus.LOST,
        deal: { ...deal, stage: targetStage },
        originalStage
      });
      return;
    }
    setConfirmMoveModal({
      isOpen: true,
      deal: { ...deal, stage: originalStage },
      targetStage,
      originalStage,
    });
  };

  const handleConfirmMoveSubmit = () => {
    if (!confirmMoveModal.deal || !confirmMoveModal.targetStage || !confirmMoveModal.originalStage) return;
    const { deal, targetStage, originalStage } = confirmMoveModal;
    
    const stage = targetStage as LeadStatus;

    updateLeadMutate({ id: deal.id, data: { stage } }, {
      onSuccess: () => {
        toast.success(`Lead moved from ${LEAD_STATUS_LABELS[originalStage] || originalStage} to ${LEAD_STATUS_LABELS[targetStage] || targetStage}.`);
        setConfirmMoveModal(prev => ({ ...prev, isOpen: false }));
      },
      onError: () => {
        toast.error("Unable to update lead.");
        setConfirmMoveModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleWonLostSubmit = (data: WonLostSubmitData) => {
    if (!wonLostModal.deal || !wonLostModal.type) return;
    
    const stage = wonLostModal.type as LeadStatus;
    
    updateLeadMutate({
      id: wonLostModal.deal.id,
      data: {
        stage,
        ...(stage === LeadStatus.WON 
            ? { wonReason: data.reason, wonDate: data.wonDate, actualRevenue: data.actualRevenue, notes: data.notes } 
            : { lostReason: data.reason, competitor: data.competitor, notes: data.notes })
      }
    }, {
      onSuccess: () => {
        toast.success(`Lead moved to ${LEAD_STATUS_LABELS[stage] || stage}.`);
        setWonLostModal(prev => ({ ...prev, isOpen: false }));
      },
      onError: () => {
        toast.error("Unable to update lead.");
        setWonLostModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAction = (e: React.MouseEvent, action: string, leadName: string, lead?: LeadType) => {
    e.stopPropagation();

    if (action === "Email Draft" && lead?.email) {
      window.location.href = `mailto:${lead.email}`;
    } else if (action === "Call Initiated" && lead?.phone) {
      window.location.href = `tel:${lead.phone}`;
    }

    toast.success(`${action} Initiated`, {
      description: `Action applied to ${leadName}`,
    });
  };

  const columns = [
    {
      header: (
        <Checkbox 
          checked={selectedIds.length === leads.length && leads.length > 0}
          onCheckedChange={toggleSelectAll}
        />
      ),
      cell: (lead: LeadType) => (
        <Checkbox 
          checked={selectedIds.includes(lead.id)}
          onCheckedChange={() => toggleSelect(lead.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      className: "w-[40px] pr-0",
    },
    {
      header: "Lead Information",
      sortable: true,
      sortDirection: sortConfig?.key === "name" ? (sortConfig.direction as "asc" | "desc") : null,
      onSort: (dir: import("@/shared/components/DataTableColumnHeader").SortDirection) => setSort("name", dir),
      cell: (lead: LeadType) => (
        <div className="flex items-center gap-3 py-1 cursor-pointer group" onClick={(e) => { e.stopPropagation(); setDetailsLeadId(lead.id); }}>
          <Avatar className="w-10 h-10 rounded-full border border-border shadow-sm group-hover:border-primary/50 transition-colors">
            <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
              {lead.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-foreground text-sm leading-none group-hover:text-primary transition-colors">{lead.name}</p>
              <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md font-medium">
                {lead.company}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> {lead.email}
              </span>
            </div>
          </div>
        </div>
      ),
      className: "w-full min-w-[240px]",
    },
    {
      header: (
        <div className="text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground">Stage</div>
      ),
      cell: (lead: LeadType) => (
        <StatusBadge 
          status={lead.status} 
          variant={statusVariantMap[lead.stage] || "slate"} 
        />
      ),
      className: "w-[130px]",
    },
    {
      header: (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-1 cursor-pointer hover:text-foreground text-muted-foreground transition-colors text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight group">
              Priority
              <ChevronDown className={cn("w-3 h-3 transition-opacity", filters.priority !== "All Priorities" ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100")} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {["All Priorities", "Low", "Medium", "High"].map(p => (
              <DropdownMenuItem key={p} onClick={() => updateFilter("priority", p)} className="text-xs cursor-pointer">
                {p}
                {filters.priority === p && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      cell: (lead: LeadType) => {
        return (
          <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 h-4", getPriorityColor(lead.priority))}>
            {lead.priority || "Low"}
          </Badge>
        );
      },
      className: "w-[90px]",
    },
    {
      header: (
        <div className="text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground">Phone</div>
      ),
      cell: (lead: LeadType) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
          {lead.phone || "N/A"}
        </div>
      ),
      className: "w-[130px]",
    },
    {
      header: "Deal Value",
      align: "right" as const,
      sortable: true,
      sortDirection: sortConfig?.key === "valueAmount" ? (sortConfig.direction as "asc" | "desc") : null,
      onSort: (dir: import("@/shared/components/DataTableColumnHeader").SortDirection) => setSort("valueAmount", dir),
      cell: (lead: LeadType) => {
        const prob = lead.probability || 0;
        const val = lead.valueAmount ? formatCurrency(lead.valueAmount) : formatCurrency(Number(String(lead.value).replace(/[^0-9.-]+/g,"")));
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-foreground">{val}</span>
            <span className="text-xs font-semibold text-muted-foreground">{prob}%</span>
          </div>
        );
      },
      className: "w-[100px]",
    },
    {
      header: (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-1 cursor-pointer hover:text-foreground text-muted-foreground transition-colors text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight group">
              Activity
              <ChevronDown className={cn("w-3 h-3 transition-opacity", (filters.activity !== "All Activity" || sortConfig?.key === "activity") ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100")} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sort By</div>
            {[
              { label: "Newest Activity", val: "newest" },
              { label: "Oldest Activity", val: "oldest" },
              { label: "Upcoming Follow-up", val: "upcoming" },
              { label: "Overdue First", val: "overdue" },
            ].map(s => (
              <DropdownMenuItem key={s.val} onClick={() => handleSort("activity", s.val as ReturnType<typeof JSON.parse>)} className="text-xs cursor-pointer">
                {s.label}
                {sortConfig?.key === "activity" && sortConfig.direction === s.val && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Filter By</div>
            {["All Activity", "Overdue", "Today", "Tomorrow", "This Week", "No Follow-up Scheduled", "No Activity"].map(f => (
              <DropdownMenuItem key={f} onClick={() => updateFilter("activity", f)} className="text-xs cursor-pointer">
                {f}
                {filters.activity === f && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      cell: (lead: LeadType) => {
        const overdue = isOverdue(lead.followUpAt);
        const dateStr = lead.updatedAt || lead.createdAt;
        let formattedDate = "";
        if (dateStr) {
          try {
            formattedDate = new Intl.DateTimeFormat("en-US", {
              month: "short", day: "numeric", hour: "numeric", minute: "numeric", hour12: true
            }).format(new Date(dateStr));
          } catch {}
        }
        
        return (
          <div className="flex flex-col gap-1.5">
            {lead.stage === LeadStatus.WON ? (
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <span className={cn("text-xs font-medium", overdue ? "text-rose-600 font-bold" : "text-foreground")}>
                  {lead.followUp || "No Follow-up Scheduled"}
                </span>
                {overdue && (
                  <span className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Overdue
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-col mt-1">
              {lead.notes && lead.notes.length > 0 ? (
                <>
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    📝 {lead.notes.length} Note{lead.notes.length !== 1 && 's'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[160px] leading-tight">
                    <span className="font-medium">Last Note:</span> {lead.notes[0].message}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-0.5 font-medium">
                    {formatDistanceToNow(new Date(lead.notes[0].createdAt), { addSuffix: true })}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] text-muted-foreground font-semibold">Last Activity</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                    {lead.lastActivity || formattedDate || "No notes"}
                  </span>
                </>
              )}
            </div>
          </div>
        );
      },
      className: "hidden lg:table-cell w-[170px]",
      headerClassName: "hidden lg:table-cell",
    },
    {
      header: (
        <div className="text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground text-center">Notes</div>
      ),
      cell: (lead: LeadType) => {
        const count = lead.notesCount || 0;
        return (
          <div className="flex justify-center">
            <Badge 
              variant={count > 0 ? "secondary" : "outline"} 
              className={cn(
                "cursor-pointer hover:opacity-80 transition-opacity gap-1.5 px-2.5 py-1 text-xs font-semibold",
                count > 0 ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border-transparent" : "text-muted-foreground bg-transparent"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setDetailsLeadId(lead.id);
              }}
            >
              📝 {count}
            </Badge>
          </div>
        );
      },
      className: "w-[90px]",
    },
    {
      header: (
        <div className="text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground">Meetings</div>
      ),
      cell: (lead: LeadType) => {
        const meeting = lead.upcomingMeeting;
        if (!meeting) {
          return <div className="text-[11px] text-muted-foreground font-medium">No Meeting</div>;
        }
        
        let timeStr = "";
        try {
          const date = new Date(meeting.startTime);
          timeStr = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "numeric" }).format(date);
        } catch {}
        
        return (
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Upcoming</span>
            <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
              📅 {timeStr}
            </span>
          </div>
        );
      },
      className: "w-[150px]",
    },
    {
      header: (
        <div className="text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground text-right">Actions</div>
      ),
      headerClassName: "text-right",
      cell: (lead: LeadType) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-lg border-border/50">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDetailsLeadId(lead.id); }} className="gap-2 text-xs cursor-pointer"><AppIcon name="view" size={15} /> View Details</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingLead(lead); }} className="gap-2 text-xs cursor-pointer"><AppIcon name="edit" size={15} /> Edit Lead</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleAction(e, "Email Draft", lead.name, lead)} className="gap-2 text-xs cursor-pointer"><AppIcon name="mail" size={15} /> Send Email</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleAction(e, "Call Initiated", lead.name, lead)} className="gap-2 text-xs cursor-pointer"><AppIcon name="phone" size={15} /> Log Call</DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {lead.stage === LeadStatus.WON && (
                <>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); if(lead.customerId) router.push(`/customers/${lead.customerId}`); else toast.error("Customer ID not found"); }} className="gap-2 text-xs text-blue-600 focus:text-blue-700 cursor-pointer">
                    <AppIcon name="contacts" size={15} /> View Customer
                  </DropdownMenuItem>
                  {lead.isConverted && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConvertLead(lead); }} className="gap-2 text-xs text-emerald-600 focus:text-emerald-700 cursor-pointer">
                      <AppIcon name="check" size={15} /> View Deal Conversion
                    </DropdownMenuItem>
                  )}
                </>
              )}

              {lead.stage !== LeadStatus.WON && lead.stage !== LeadStatus.LOST && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConvertLead(lead); }} className="gap-2 text-xs text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950 cursor-pointer font-medium">
                  <AppIcon name="deals" size={15} /> Convert to Deal
                </DropdownMenuItem>
              )}

              {lead.stage === LeadStatus.LOST ? (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setStageTransitionLead(lead); }} className="gap-2 text-xs cursor-pointer"><AppIcon name="refresh" size={15} /> Reopen Lead</DropdownMenuItem>
              ) : lead.stage !== LeadStatus.WON ? (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setStageTransitionLead(lead); }} className="gap-2 text-xs cursor-pointer"><AppIcon name="refresh" size={15} /> Move Stage</DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator />

              {lead.stage !== LeadStatus.LOST && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setTaskLead(lead); }} className="gap-2 text-xs cursor-pointer"><AppIcon name="tasks" size={15} /> Create Task</DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setMeetingLead(lead); }} className="gap-2 text-xs cursor-pointer"><AppIcon name="calendar" size={15} /> Schedule Meeting</DropdownMenuItem>
              
              {lead.stage !== LeadStatus.LOST && (
                <>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAction(e, "Email Draft", lead.name, lead); }} className="gap-2 text-xs cursor-pointer"><AppIcon name="mail" size={15} /> Send Email</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAction(e, "Call Initiated", lead.name, lead); }} className="gap-2 text-xs cursor-pointer"><AppIcon name="phone" size={15} /> Call</DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); setDeletingLead(lead); }}
                variant="destructive"
                className="gap-2 text-xs cursor-pointer text-destructive focus:text-destructive"
              >
                <AppIcon name="trash" size={15} className="text-destructive" /> Delete Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      className: "text-right w-[110px]",
    },
  ];

  if (sortedLeads.length === 0) {
    const activeFiltersContext = [];
    if (globalSearchQuery) activeFiltersContext.push({ label: "Search", value: globalSearchQuery });
    if (globalStatusFilter && globalStatusFilter !== "all") activeFiltersContext.push({ label: "Global Stage", value: globalStatusFilter });
    if (filters.stage !== "All Stages") activeFiltersContext.push({ label: "Stage", value: filters.stage });
    if (filters.priority !== "All Priorities") activeFiltersContext.push({ label: "Priority", value: filters.priority });
    if (filters.activity !== "All Activity") activeFiltersContext.push({ label: "Activity", value: filters.activity });
    
    return (
      <LeadEmptyState 
        totalLeads={rawTotalCount ?? leads.length}
        searchQuery={globalSearchQuery}
        hasFilters={Boolean(hasActiveFilters || (globalStatusFilter && globalStatusFilter !== "all"))}
        activeFilters={activeFiltersContext}
        onClearSearch={onGlobalClearFilters}
        onClearFilters={() => {
          clearFilters();
          if (onGlobalClearFilters) onGlobalClearFilters();
        }}
        onResetAll={() => {
          clearFilters();
          if (onGlobalClearFilters) onGlobalClearFilters();
        }}
        onAddLead={onAddLead || (() => {})} 
        onImport={onImport || (() => toast.info("Import feature coming soon."))}
      />
    );
  }

  return (
    <div className="flex-auto flex flex-col min-h-0 relative gap-3.5 sm:gap-4">


      {/* Desktop & Tablet Table View */}
      <div className="hidden md:flex flex-col min-h-0 flex-1">
        <DataTable 
          data={paginatedLeads}
          columns={columns}
          rowClassName="h-16 hover:bg-muted/30 transition-colors"
          emptyTitle="No leads found"
          emptyDescription="No leads match the current search or filters."
          hasPagination={sortedLeads.length > rowsPerPage}
        />
      </div>

      {/* Mobile Card View */}
      <LeadMobileCards
        leads={paginatedLeads}
        selectedIds={selectedIds}
        statusVariantMap={statusVariantMap}
        getPriorityColor={getPriorityColor}
        isOverdue={isOverdue}
        onToggleSelect={toggleSelect}
        onEditLead={setEditingLead}
        onConvertLead={setConvertLead}
        onStageTransitionLead={setStageTransitionLead}
        onCreateTask={setTaskLead}
        onScheduleMeeting={setMeetingLead}
        onDeleteLead={setDeletingLead}
        onAction={handleAction}
      />

      {/* Pagination */}
      <CRMPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedLeads.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setCurrentPage(1);
        }}
        itemName="Leads"
        pageSizeOptions={[10, 25, 50, 100]}
      />

      {/* Bulk Action Toolbar */}
      <LeadBulkActionToolbar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onBulkEmail={() => handleAction({} as any, "Bulk Email", `${selectedIds.length} Leads`)}
        onBulkUpdateStage={() => handleAction({} as any, "Bulk Update Stage", `${selectedIds.length} Leads`)}
        onBulkDelete={() => setIsBulkDeleting(true)}
      />

      {/* Modals & Dialogs Host */}
      <LeadModalsHost
        editingLead={editingLead}
        setEditingLead={setEditingLead}
        taskLead={taskLead}
        setTaskLead={setTaskLead}
        meetingLead={meetingLead}
        setMeetingLead={setMeetingLead}
        customerLead={customerLead}
        setCustomerLead={setCustomerLead}
        stageTransitionLead={stageTransitionLead}
        setStageTransitionLead={setStageTransitionLead}
        confirmMoveModal={confirmMoveModal}
        setConfirmMoveModal={setConfirmMoveModal}
        wonLostModal={wonLostModal}
        setWonLostModal={setWonLostModal}
        isUpdating={isUpdating}
        deletingLead={deletingLead}
        setDeletingLead={setDeletingLead}
        isBulkDeleting={isBulkDeleting}
        setIsBulkDeleting={setIsBulkDeleting}
        isDeletingBulk={isDeletingBulk}
        selectedIds={selectedIds}
        addNoteLead={addNoteLead}
        setAddNoteLead={setAddNoteLead}
        detailsLeadId={detailsLeadId}
        setDetailsLeadId={setDetailsLeadId}
        convertLead={convertLead}
        setConvertLead={setConvertLead}
        handleStageChange={handleStageChange}
        handleConfirmMoveSubmit={handleConfirmMoveSubmit}
        handleWonLostSubmit={handleWonLostSubmit}
        handleDelete={handleDelete}
        handleBulkDelete={handleBulkDelete}
      />
    </div>
  );
};

export default LeadsTable;


