"use client";

import React, { useState } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Globe,
  Share2,
  Megaphone,
  Mail,
  Users,
  CheckCircle2,
  Save,
} from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { toast } from "sonner";

interface LeadSource {
  id: string;
  name: string;
  category: string;
  active: boolean;
  totalLeads: number;
}

const DEFAULT_SOURCES: LeadSource[] = [
  { id: "1", name: "Website Contact Form", category: "Inbound Web", active: true, totalLeads: 245 },
  { id: "2", name: "Google Search Ads (PPC)", category: "Paid Media", active: true, totalLeads: 189 },
  { id: "3", name: "LinkedIn InMail & Outreach", category: "Outbound", active: true, totalLeads: 112 },
  { id: "4", name: "Customer Referrals", category: "Word of Mouth", active: true, totalLeads: 78 },
  { id: "5", name: "Webinar & Events", category: "Events", active: true, totalLeads: 64 },
  { id: "6", name: "Cold Email Campaign", category: "Outbound", active: false, totalLeads: 32 },
];

export default function LeadSourcesSettings() {
  const [sources, setSources] = useState<LeadSource[]>(DEFAULT_SOURCES);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceCat, setNewSourceCat] = useState("Inbound Web");

  const handleToggleActive = (id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) return;
    const newSource: LeadSource = {
      id: Date.now().toString(),
      name: newSourceName.trim(),
      category: newSourceCat,
      active: true,
      totalLeads: 0,
    };
    setSources([...sources, newSource]);
    setNewSourceName("");
    toast.success(`Source "${newSource.name}" created`);
  };

  const handleDelete = (id: string) => {
    setSources(sources.filter((s) => s.id !== id));
    toast.success("Lead source removed");
  };

  return (
    <div className="space-y-6">
      <CRMCard>
        <div className="pb-4 border-b border-border/50">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Lead Acquisition Sources & Channels
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Configure origin categories and tracking channels for attribution reports.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:border-border transition-colors text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {source.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{source.name}</p>
                  <p className="text-[11px] text-muted-foreground">{source.category} • {source.totalLeads} leads tracked</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{source.active ? "Active" : "Disabled"}</span>
                  <Switch
                    checked={source.active}
                    onCheckedChange={() => handleToggleActive(source.id)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(source.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Source Form */}
        <form onSubmit={handleAddSource} className="mt-5 p-3.5 rounded-xl border border-dashed flex flex-col sm:flex-row items-center gap-3">
          <Input
            placeholder="Enter source channel name..."
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            className="text-xs h-9 flex-1"
          />
          <Input
            placeholder="Enter category..."
            value={newSourceCat}
            onChange={(e) => setNewSourceCat(e.target.value)}
            className="text-xs h-9 w-44"
          />
          <Button type="submit" size="sm" variant="secondary" className="text-xs font-semibold gap-1.5 h-9 shrink-0">
            <Plus className="w-3.5 h-3.5" /> Add Channel
          </Button>
        </form>
      </CRMCard>
    </div>
  );
}
