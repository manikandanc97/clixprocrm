"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Search,
  ExternalLink,
  Video,
  FileText,
  Keyboard,
  Sparkles,
  ArrowRight,
  LifeBuoy,
} from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import Link from "next/link";

interface DocArticle {
  id: string;
  title: string;
  category: string;
  readTime: string;
  url: string;
}

const ARTICLES: DocArticle[] = [
  {
    id: "1",
    title: "Quickstart: Setting Up Your Sales Pipeline & Stages",
    category: "Getting Started",
    readTime: "4 min read",
    url: "/help",
  },
  {
    id: "2",
    title: "Managing Role-Based Access and Workspace Permissions",
    category: "Administration",
    readTime: "6 min read",
    url: "/help",
  },
  {
    id: "3",
    title: "How to Generate Quotations and PDF Proformas",
    category: "Deals & Sales",
    readTime: "3 min read",
    url: "/help",
  },
  {
    id: "4",
    title: "Setting Up Two-Factor Authentication (2FA TOTP)",
    category: "Security",
    readTime: "2 min read",
    url: "/help",
  },
  {
    id: "5",
    title: "Automating Lead Distribution with Round-Robin Routing",
    category: "Automation",
    readTime: "5 min read",
    url: "/help",
  },
];

const SHORTCUTS = [
  { key: "⌘ + K / Ctrl + K", desc: "Global search across leads, deals, and tasks" },
  { key: "N", desc: "Create new deal or quotation quick action" },
  { key: "Esc", desc: "Close open modal or drawer" },
  { key: "?", desc: "Toggle keyboard shortcuts help modal" },
];

export default function HelpCenterSettings() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredArticles = ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <CRMCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/50">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Help Center & Documentation Hub
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Knowledge base guides, video walkthroughs, and keyboard shortcuts for ClixProCRM.
            </p>
          </div>
          <Button
            size="sm"
            asChild
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Link href="/help">
              <ExternalLink className="w-3.5 h-3.5" />
              Full Help Portal
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="pt-4 pb-2">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search help articles and documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Popular Articles */}
        <div className="mt-4 space-y-2.5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Featured Guides
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={article.url}
                className="p-3.5 rounded-xl border bg-card hover:border-primary/40 hover:bg-primary/[0.02] transition-all flex items-start justify-between gap-2 text-xs group"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    {article.category}
                  </span>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {article.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{article.readTime}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </div>
      </CRMCard>

      {/* Keyboard Shortcuts Reference */}
      <CRMCard>
        <div className="pb-4 border-b border-border/50">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-primary" />
            Productivity Keyboard Shortcuts
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Boost your CRM speed with global keyboard hotkeys.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
          {SHORTCUTS.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <span className="text-muted-foreground">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border/80 font-mono text-[10px] font-bold text-foreground">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </CRMCard>
    </div>
  );
}
