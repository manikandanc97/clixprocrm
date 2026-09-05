"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Search,
  ArrowRight,
  Sparkles,
  Layers,
  ShieldCheck,
  CreditCard,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Keyboard,
} from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { toast } from "sonner";

interface DocArticle {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  content: {
    overview: string;
    steps: string[];
    tip?: string;
    codeSnippet?: string;
  };
}

const CATEGORIES = [
  { id: "ALL", label: "All Guides" },
  { id: "Getting Started", label: "🚀 Getting Started", icon: Sparkles },
  { id: "Sales Pipeline", label: "🎯 Pipeline & Deals", icon: Layers },
  { id: "Quotations & Billing", label: "💰 Quotations & Billing", icon: CreditCard },
  { id: "Roles & RBAC", label: "🛡️ Roles & Permissions", icon: ShieldCheck },
  { id: "AI & Automation", label: "🤖 AI Assistant", icon: Sparkles },
  { id: "API & Webhooks", label: "🔌 API & Webhooks", icon: Zap },
];

const ARTICLES: DocArticle[] = [
  {
    id: "doc-1",
    title: "Quickstart: Setting Up Your Workspace, Team & Pipeline",
    category: "Getting Started",
    readTime: "3 min read",
    summary: "A step-by-step guide to configure your company workspace, default currency, invite team members, and customize initial deal stages.",
    content: {
      overview: "Welcome to ClixPro CRM. Getting your sales workspace configured properly takes less than 5 minutes. Follow these fundamental setup steps to onboard your team.",
      steps: [
        "Navigate to Settings > Workspace & Organization to set your official Company Name, Base Currency (INR/USD), and Logo.",
        "Go to Administration > Employees to send secure email invites with assigned CRM Roles (Sales Executive, Manager, Admin).",
        "Open Deals > Pipeline Settings to customize stages (e.g. Lead In, Qualification, Proposal, Contract Sent, Closed Won).",
        "Enable automated email notifications in Settings > Notifications to stay alerted on new deal assignments.",
      ],
      tip: "You can re-order pipeline stages at any time by simply dragging stage columns on the Kanban board.",
    },
  },
  {
    id: "doc-2",
    title: "Managing Multi-Tier Role-Based Access Control (RBAC)",
    category: "Roles & RBAC",
    readTime: "4 min read",
    summary: "Learn how granular permissions, role hierarchies, and sensitive data access restrictions work in ClixPro CRM.",
    content: {
      overview: "ClixPro CRM features an enterprise RBAC engine that enforces field-level security and module isolation across your organization.",
      steps: [
        "Go to Administration > Role Management to view existing system roles (Super Admin, Admin, Manager, Sales Executive, Support).",
        "Click 'Create Custom Role' to define bespoke permissions such as 'Can Export Leads to CSV' or 'View Only Assigned Deals'.",
        "Enforce Two-Factor Authentication (2FA TOTP) workspace-wide under Settings > Security & Privacy.",
        "Use Audit Logs under Administration to review administrative access and permission mutations.",
      ],
      tip: "Sales Executives can only view deals and customers assigned to their user ID unless granted 'View Team Records' capability.",
    },
  },
  {
    id: "doc-3",
    title: "Generating Quotations, PDF Proformas & Tax Invoices",
    category: "Quotations & Billing",
    readTime: "4 min read",
    summary: "How to assemble line items, configure GST/VAT tax rates, apply discounts, and generate professional downloadable PDF quotations.",
    content: {
      overview: "The Quotations module allows your sales team to create branded proformas, calculate itemized taxes, and convert approved quotes into active deals with 1-click.",
      steps: [
        "Navigate to Quotations and click '+ Create Quotation'.",
        "Select an existing Customer or quickly add a new Contact reference.",
        "Add catalog products or custom item rows with Unit Price, Quantity, and Tax Percentage (e.g. 18% GST).",
        "Click 'Preview PDF' to generate the client-facing proposal with your organization letterhead and payment instructions.",
        "Share the direct PDF link or download and attach it directly to an email.",
      ],
      tip: "When a customer approves a quote, click 'Convert to Deal' to automatically transition the record into your sales pipeline without re-entering data.",
    },
  },
  {
    id: "doc-4",
    title: "Using ClixPro AI Copilot for Deal Scoring & Lead Summaries",
    category: "AI & Automation",
    readTime: "3 min read",
    summary: "Leverage built-in AI models to calculate win-probability, analyze client sentiment, and draft follow-up emails.",
    content: {
      overview: "ClixPro AI analyzes customer activity history, communication logs, and historical closure rates to provide predictive deal intelligence.",
      steps: [
        "Open any active Deal or Lead record.",
        "Click the '✨ ClixPro AI Analysis' tab in the right contextual drawer.",
        "Review the automated Win-Probability Score and key deal risk factors identified by the AI model.",
        "Click 'Draft Follow-Up Email' to generate a contextual follow-up message tailored to the deal's current stage.",
      ],
      tip: "You can customize your AI prompts and temperature under Settings > AI Intelligence.",
    },
  },
  {
    id: "doc-5",
    title: "Connecting External Apps via REST API & Webhooks",
    category: "API & Webhooks",
    readTime: "5 min read",
    summary: "Integrate your website forms, ERP, WhatsApp bot, or third-party webhooks directly with ClixPro CRM.",
    content: {
      overview: "ClixPro CRM provides a modern JSON REST API with HMAC webhook dispatches on events like `lead.created`, `deal.won`, and `quotation.paid`.",
      steps: [
        "Go to Settings > Developer & API Keys and click 'Generate API Token'.",
        "Include the Bearer token in your HTTP Authorization header: `Authorization: Bearer crm_live_...`",
        "To ingest leads from your landing page, send a POST request to `/api/leads` with JSON body payload.",
        "Configure Webhook endpoints under Settings > Webhooks to receive real-time notifications on deal progression.",
      ],
      codeSnippet: `// Example cURL: Ingest Lead into ClixPro CRM
curl -X POST https://api.clixprocrm.com/leads \\
  -H "Authorization: Bearer crm_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Alex Johnson",
    "email": "alex@acmecorp.com",
    "phone": "+1-555-0199",
    "company": "Acme Corp",
    "source": "Website Contact Form",
    "budget": 25000
  }'`,
      tip: "All API requests are rate-limited to 1,000 requests per minute on Enterprise plans.",
    },
  },
  {
    id: "doc-6",
    title: "Automating Lead Routing with Round-Robin Assignment",
    category: "Sales Pipeline",
    readTime: "3 min read",
    summary: "Distribute incoming website leads equally among your sales reps based on availability and territory rules.",
    content: {
      overview: "Ensure zero lead leakage and immediate response times by automatically assigning incoming prospects to available sales reps.",
      steps: [
        "Navigate to Leads > Assignment Rules in the dashboard.",
        "Create an Assignment Rule and choose 'Round-Robin Rotation'.",
        "Select the participating sales team members or user groups.",
        "Optionally apply territory filters (e.g. South Region leads -> South Sales Team).",
      ],
      tip: "Reps who set their status to 'Out of Office' are automatically skipped in the round-robin queue.",
    },
  },
];

const SHORTCUTS = [
  { key: "⌘ + K / Ctrl + K", desc: "Global Quick Search across leads, deals, and tasks" },
  { key: "N", desc: "Create new record quick menu" },
  { key: "Esc", desc: "Close open modal, drawer, or dialog" },
  { key: "G then D", desc: "Go to Deals board" },
  { key: "G then L", desc: "Go to Leads database" },
  { key: "G then Q", desc: "Go to Quotations module" },
  { key: "?", desc: "Toggle keyboard shortcuts cheat sheet" },
];

export function DocumentationHub() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeArticle, setActiveArticle] = useState<DocArticle | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, "yes" | "no">>({});

  const filteredArticles = ARTICLES.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = selectedCategory === "ALL" || article.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  const handleFeedback = (articleId: string, type: "yes" | "no") => {
    setFeedbackGiven((prev) => ({ ...prev, [articleId]: type }));
    toast.success(type === "yes" ? "Thanks for your feedback! 👍" : "Thank you. We'll improve this guide! 📝");
  };

  const copySnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success("Code snippet copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <Card className="border-border bg-gradient-to-r from-primary/5 via-card to-card shadow-card rounded-2xl overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> ClixPro CRM Knowledge Base & Documentation
            </h2>
            <p className="text-xs text-muted-foreground">
              Search step-by-step guides, API references, pipeline configuration tutorials, and keyboard shortcuts.
            </p>
          </div>

          <div className="relative max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search guides (e.g., Quotations, RBAC permissions, Round-Robin, API)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-xs bg-background/90"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <Card className="border-dashed shadow-card rounded-2xl overflow-hidden">
          <CardContent className="py-16 text-center space-y-2">
            <p className="text-sm font-bold text-foreground">No guides match your search criteria</p>
            <p className="text-xs text-muted-foreground">Try searching with different keywords or select &quot;All Guides&quot;.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("ALL");
              }}
              className="text-xs font-semibold mt-2 h-8"
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              onClick={() => setActiveArticle(article)}
              className="border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-card flex flex-col justify-between group rounded-2xl shadow-card overflow-hidden"
            >
              <CardContent className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">
                      {article.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">{article.readTime}</span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Keyboard Shortcuts Cheat Sheet Card */}
      <Card className="border-border shadow-card rounded-2xl overflow-hidden">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-primary" /> Productivity Keyboard Shortcuts
            </h3>
            <span className="text-[10px] text-muted-foreground font-medium">Global Navigation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {SHORTCUTS.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs"
              >
                <span className="text-muted-foreground truncate mr-2">{s.desc}</span>
                <kbd className="px-2 py-0.5 rounded bg-muted border border-border font-mono text-[10px] font-bold text-foreground shrink-0 shadow-2xs">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Article Reading Modal */}
      <Dialog open={!!activeArticle} onOpenChange={(open) => !open && setActiveArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 gap-0">
          {activeArticle && (
            <div>
              <DialogHeader className="p-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
                <div className="flex items-center justify-between gap-2 pr-6">
                  <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20">
                    {activeArticle.category}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-medium">{activeArticle.readTime}</span>
                </div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground text-left mt-2">
                  {activeArticle.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground text-left">
                  {activeArticle.summary}
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 space-y-5 text-xs">
                {/* Overview */}
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-foreground leading-relaxed">
                  {activeArticle.content.overview}
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Step-by-Step Instructions
                  </h4>
                  <div className="space-y-2.5">
                    {activeArticle.content.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-foreground leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Tip */}
                {activeArticle.content.tip && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Pro Tip: </span>
                      <span>{activeArticle.content.tip}</span>
                    </div>
                  </div>
                )}

                {/* Optional Code Snippet */}
                {activeArticle.content.codeSnippet && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Example API Payload</span>
                      <button
                        type="button"
                        onClick={() => copySnippet(activeArticle.content.codeSnippet!)}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copiedCode ? "Copied" : "Copy Code"}
                      </button>
                    </div>
                    <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
                      {activeArticle.content.codeSnippet}
                    </pre>
                  </div>
                )}

                {/* Helpful Feedback Section */}
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Was this guide helpful?</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={feedbackGiven[activeArticle.id] === "yes" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFeedback(activeArticle.id, "yes")}
                      className="h-8 text-xs font-semibold gap-1.5 px-3"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Yes
                    </Button>
                    <Button
                      variant={feedbackGiven[activeArticle.id] === "no" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFeedback(activeArticle.id, "no")}
                      className="h-8 text-xs font-semibold gap-1.5 px-3"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> No
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
