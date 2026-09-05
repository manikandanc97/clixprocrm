"use client";

import React, { useState } from "react";
import {
  Rocket,
  Search,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";

interface ReleaseItem {
  version: string;
  isCurrent?: boolean;
  date: string;
  title: string;
  summary: string;
  changes: Array<{
    type: "feature" | "improvement" | "fix" | "security";
    text: string;
  }>;
}

const RELEASES: ReleaseItem[] = [
  {
    version: "v1.2.0",
    isCurrent: true,
    date: "August 2026",
    title: "Enterprise Multi-Workspace, Real-time Support & Security Upgrade",
    summary: "Enhanced ticketing infrastructure with instant diagnostics, clipboard screenshot uploads, rate-limiting protections, and sub-millisecond API response optimization.",
    changes: [
      { type: "feature", text: "New Help & Support command center with real-time ticket tracking, conversation history, and diagnostic logs." },
      { type: "feature", text: "Clipboard screenshot paste support (Ctrl+V / ⌘+V) directly into ticket and description drawers." },
      { type: "improvement", text: "Upgraded table virtualization and optimized pagination rendering for leads and deals pipelines." },
      { type: "security", text: "Enforced rate-limiting across support ticket submissions and public API endpoints." },
      { type: "fix", text: "Fixed Quotation item tax calculation precision when converting between foreign currencies." },
      { type: "fix", text: "Resolved modal backdrop z-index overlay conflict during rapid keyboard navigation." },
    ],
  },
  {
    version: "v1.1.0",
    date: "July 2026",
    title: "AI Deal Intelligence & PDF Proforma Invoicing",
    summary: "Integrated ClixPro AI Copilot for win-probability prediction, automated follow-up drafts, and server-side PDF quotation rendering.",
    changes: [
      { type: "feature", text: "Introduced ClixPro AI Copilot: automated lead sentiment scoring and AI-generated email responses." },
      { type: "feature", text: "High-resolution downloadable PDF quotation generator with company logo watermarking." },
      { type: "improvement", text: "Redesigned Kanban board drag-and-drop animations with haptic visual cues." },
      { type: "security", text: "Added Two-Factor Authentication (2FA TOTP) support with QR code setup." },
      { type: "fix", text: "Fixed timezone synchronization issue for recurring meeting reminders." },
    ],
  },
  {
    version: "v1.0.0",
    date: "June 2026",
    title: "Initial Launch of ClixPro CRM Platform",
    summary: "The foundational release featuring multi-tenancy, granular Role-Based Access Control (RBAC), leads & deals pipeline, customer directory, and executive analytics.",
    changes: [
      { type: "feature", text: "Multi-tenant workspace isolation with role hierarchies (Admin, Manager, Sales Rep, Support)." },
      { type: "feature", text: "Dynamic deals pipeline with customizable stage rules and deal value metrics." },
      { type: "feature", text: "Customer and Contacts directory with custom fields and audit timeline tracking." },
      { type: "feature", text: "Granular permission toggle system with instant tenant policy propagation." },
    ],
  },
];

const TYPE_CONFIG = {
  feature: {
    label: "Feature",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
  },
  improvement: {
    label: "Improvement",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  security: {
    label: "Security",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
    dotColor: "bg-purple-500",
  },
  fix: {
    label: "Fix",
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
};

export function ReleaseNotesView() {
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReleases = RELEASES.map((rel) => {
    const matchingChanges = rel.changes.filter((c) => {
      const matchesType = selectedType === "ALL" || c.type === selectedType;
      const matchesSearch =
        searchTerm === "" ||
        c.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rel.version.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });

    return {
      ...rel,
      changes: matchingChanges,
    };
  }).filter((rel) => rel.changes.length > 0 || searchTerm === "");

  return (
    <div className="space-y-6">
      {/* Header card with filters */}
      <Card className="border-border bg-gradient-to-r from-primary/5 via-card to-card shadow-card rounded-2xl overflow-hidden">
        <CardContent className="p-6 md:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" /> ClixPro CRM Changelog & What&apos;s New
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Explore feature enhancements, performance optimizations, and security patches.
              </p>
            </div>

            <Badge variant="outline" className="text-xs font-bold bg-primary/10 text-primary border-primary/20 self-start sm:self-auto py-1 px-2.5">
              Current: v1.2.0 Enterprise
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search updates (e.g., PDF, 2FA, Quotations)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: "ALL", label: "All Changes" },
                { id: "feature", label: "✨ Features" },
                { id: "improvement", label: "⚡ Improvements" },
                { id: "security", label: "🛡️ Security" },
                { id: "fix", label: "🐛 Bug Fixes" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSelectedType(filter.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedType === filter.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Releases */}
      <div className="space-y-6">
        {filteredReleases.map((release) => (
          <Card key={release.version} className="border-border shadow-card rounded-2xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-foreground">{release.version}</span>
                  {release.isCurrent && (
                    <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5">
                      Current Active Release
                    </Badge>
                  )}
                  <h3 className="text-sm font-bold text-foreground hidden md:inline">• {release.title}</h3>
                </div>
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> {release.date}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{release.summary}</p>

              <div className="space-y-2 pt-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Release Highlights ({release.changes.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {release.changes.map((change, idx) => {
                    const typeMeta = TYPE_CONFIG[change.type] || TYPE_CONFIG.feature;
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-muted/20 text-xs"
                      >
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold shrink-0 uppercase tracking-wider ${typeMeta.badgeColor}`}
                        >
                          {typeMeta.label}
                        </Badge>
                        <span className="text-foreground leading-relaxed flex-1">{change.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
