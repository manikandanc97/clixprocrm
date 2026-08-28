"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Paperclip,
  ArrowRight,
  Send,
  Loader2,
  Calendar,
  Laptop,
  User,
  Plus,
  ExternalLink,
  ChevronRight,
  Check,
  Copy,
} from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { toast } from "sonner";
import client from "@/shared/lib/api/client";
import ReactMarkdown from "react-markdown";

export interface TicketItem {
  id: string;
  ticketId: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  description: string;
  diagnostics?: any;
  attachments?: { filename: string; size: number }[];
  estimatedResponseTime?: string;
  createdAt: string;
  updatedAt: string;
  replies?: Array<{
    id: string;
    author: string;
    authorRole: string;
    message: string;
    createdAt: string;
    isStaff: boolean;
  }>;
}

const STATUS_CONFIG = {
  OPEN: {
    label: "Open",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    dot: "bg-amber-500 animate-pulse",
  },
  RESOLVED: {
    label: "Resolved",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  CLOSED: {
    label: "Closed",
    color: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

const PRIORITY_CONFIG = {
  Critical: {
    label: "Critical",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
  },
  High: {
    label: "High",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  },
  Medium: {
    label: "Medium",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  Low: {
    label: "Low",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
};

interface TicketHistoryListProps {
  onNewTicketClick?: () => void;
}

export function TicketHistoryList({ onNewTicketClick }: TicketHistoryListProps) {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get("/support/tickets");
      const list = res.data?.data || [];
      setTickets(list);
    } catch (error) {
      console.error("Failed to load tickets:", error);
      toast.error("Could not fetch support tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setIsReplying(true);
      const res = await client.post(`/support/tickets/${selectedTicket.ticketId}/reply`, {
        message: replyText.trim(),
      });
      const updatedTicket = res.data?.data;
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
        setTickets((prev) =>
          prev.map((t) => (t.ticketId === updatedTicket.ticketId ? updatedTicket : t))
        );
      }
      setReplyText("");
      toast.success("Reply added to ticket thread.");
    } catch (error: any) {
      console.error("Reply failed:", error);
      toast.error(error?.response?.data?.error?.message || "Failed to send reply.");
    } finally {
      setIsReplying(false);
    }
  };

  const copyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Ticket ID copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "Recently";
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <Card className="border-border shadow-card rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ticket ID, subject, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                  <SelectItem value="OPEN" className="text-xs">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS" className="text-xs">In Progress</SelectItem>
                  <SelectItem value="RESOLVED" className="text-xs">Resolved</SelectItem>
                  <SelectItem value="CLOSED" className="text-xs">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-9 text-xs w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">All Priorities</SelectItem>
                  <SelectItem value="Critical" className="text-xs">Critical</SelectItem>
                  <SelectItem value="High" className="text-xs">High</SelectItem>
                  <SelectItem value="Medium" className="text-xs">Medium</SelectItem>
                  <SelectItem value="Low" className="text-xs">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchTickets}
                disabled={loading}
                className="h-9 px-3 text-xs"
                title="Refresh tickets list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {loading ? (
        <Card className="border-border shadow-card rounded-2xl overflow-hidden">
          <CardContent className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-xs font-medium">Loading support tickets...</p>
          </CardContent>
        </Card>
      ) : filteredTickets.length === 0 ? (
        <Card className="border-dashed shadow-card rounded-2xl overflow-hidden">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">No Support Tickets Found</h4>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                {searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL"
                  ? "Try clearing your search or status filters to view all records."
                  : "You haven't submitted any support tickets yet."}
              </p>
            </div>
            {onNewTicketClick && (
              <Button size="sm" onClick={onNewTicketClick} className="text-xs font-semibold h-8 mt-2 gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Create New Ticket
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredTickets.map((ticket) => {
            const statusMeta = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
            const priorityMeta = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.Medium;
            const hasReplies = ticket.replies && ticket.replies.length > 0;

            return (
              <Card
                key={ticket.ticketId}
                onClick={() => setSelectedTicket(ticket)}
                className="border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-card group rounded-2xl shadow-card overflow-hidden"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                          {ticket.ticketId}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => copyId(ticket.ticketId, e)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                          title="Copy ID"
                        >
                          {copiedId === ticket.ticketId ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <Badge variant="outline" className={`text-[10px] font-bold ${statusMeta.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusMeta.dot}`} />
                          {statusMeta.label}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] font-bold ${priorityMeta.color}`}>
                          {priorityMeta.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded bg-muted/60 border border-border/50">
                          {ticket.category}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {ticket.subject}
                      </h4>

                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {ticket.description}
                      </p>
                    </div>

                    <div className="flex items-center sm:flex-col items-end justify-between sm:justify-center gap-2 sm:gap-1 text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                      <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatRelativeTime(ticket.createdAt)}
                      </span>

                      <div className="flex items-center gap-2">
                        {ticket.attachments && ticket.attachments.length > 0 && (
                          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Paperclip className="w-3 h-3 text-primary" /> {ticket.attachments.length}
                          </span>
                        )}
                        {hasReplies && (
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {ticket.replies?.length}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all hidden sm:block" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Ticket Details & Discussion Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 gap-0">
          {selectedTicket && (
            <div>
              <DialogHeader className="p-5 pb-4 border-b border-border sticky top-0 bg-background z-10">
                <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                      {selectedTicket.ticketId}
                    </span>
                    <Badge variant="outline" className={`text-[10px] font-bold ${STATUS_CONFIG[selectedTicket.status]?.color}`}>
                      {STATUS_CONFIG[selectedTicket.status]?.label}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] font-bold ${PRIORITY_CONFIG[selectedTicket.priority]?.color}`}>
                      {PRIORITY_CONFIG[selectedTicket.priority]?.label}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Created {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                </div>
                <DialogTitle className="text-base font-bold text-foreground text-left mt-2">
                  {selectedTicket.subject}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground text-left">
                  Category: <strong className="text-foreground">{selectedTicket.category}</strong> • SLA Target: <strong className="text-foreground">{selectedTicket.estimatedResponseTime || "< 12 Hours"}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="p-5 space-y-6">
                {/* Initial Description */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
                      <User className="w-3 h-3" />
                    </div>
                    <span>{selectedTicket.userName || "Requester"}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">• Initial Submission</span>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border border-border/70 text-xs text-foreground leading-relaxed prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{selectedTicket.description}</ReactMarkdown>
                  </div>
                </div>

                {/* Attachments list */}
                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-primary" /> Attachments ({selectedTicket.attachments.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedTicket.attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs">
                          <span className="font-medium text-foreground truncate max-w-[200px]">{att.filename}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {att.size ? `${(att.size / 1024).toFixed(1)} KB` : "Attached"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation Thread / Replies */}
                {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-border/60">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Ticket Updates & Responses
                    </h5>
                    <div className="space-y-3">
                      {selectedTicket.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                            reply.isStaff
                              ? "bg-primary/5 border-primary/20 mr-4"
                              : "bg-muted/40 border-border ml-4"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              {reply.author}
                              {reply.isStaff && (
                                <Badge className="text-[9px] bg-primary text-primary-foreground py-0 px-1.5 h-4">
                                  Support Staff
                                </Badge>
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(reply.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Reply Composer */}
                <div className="space-y-2.5 pt-3 border-t border-border">
                  <label className="text-xs font-bold text-foreground">Post a Reply or Additional Details</label>
                  <Textarea
                    placeholder="Add follow-up notes, answers to support queries, or new details..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="text-xs resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleSendReply}
                      disabled={isReplying || !replyText.trim()}
                      className="text-xs font-semibold h-8 gap-1.5 px-3.5"
                    >
                      {isReplying ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" /> Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
