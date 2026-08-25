"use client";

import React, { useState } from "react";
import {
  Boxes,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Sparkles,
  Zap,
  Globe,
  Mail,
  MessageSquare,
  Copy,
} from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  description: string;
  connected: boolean;
  iconBg: string;
  account?: string;
}

const INTEGRATIONS_LIST: IntegrationItem[] = [
  {
    id: "google",
    name: "Google Workspace & Gmail",
    category: "Email & Calendar",
    description: "Sync calendar meetings, log inbound emails, and create leads directly from Gmail.",
    connected: true,
    iconBg: "bg-red-500/10 text-red-600",
    account: "admin@company.com",
  },
  {
    id: "outlook",
    name: "Microsoft 365 / Outlook",
    category: "Email & Calendar",
    description: "Bi-directional email tracking and Office 365 calendar scheduling integration.",
    connected: false,
    iconBg: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "slack",
    name: "Slack Notifications",
    category: "Communication",
    description: "Post deal updates, new leads, and team mentions directly into designated Slack channels.",
    connected: true,
    iconBg: "bg-purple-500/10 text-purple-600",
    account: "#sales-deals",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business API",
    category: "Messaging",
    description: "Send automated WhatsApp confirmations, quotation links, and message clients directly.",
    connected: false,
    iconBg: "bg-emerald-500/10 text-emerald-600",
  },
  {
    id: "zapier",
    name: "Zapier Connect",
    category: "Automation",
    description: "Connect ClixProCRM with 5,000+ apps using instant trigger and action zaps.",
    connected: true,
    iconBg: "bg-amber-500/10 text-amber-600",
    account: "6 Active Zaps",
  },
];

export default function IntegrationsSettings() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(INTEGRATIONS_LIST);
  const [apiKey] = useState("clx_live_948fbc839201948572a1");
  const [webhookUrl, setWebhookUrl] = useState("https://api.clixprocrm.com/v1/webhooks/incoming");

  const handleToggle = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, connected: !item.connected } : item
      )
    );
    toast.success("Integration status updated");
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API Key copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Integrations Hub */}
      <CRMCard>
        <div className="pb-4 border-b border-border/50">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Boxes className="w-4 h-4 text-primary" />
            Connected Apps & Integrations
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Integrate your CRM with email providers, chat tools, and external automation platforms.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((app) => (
            <div
              key={app.id}
              className="p-4 rounded-xl border flex flex-col justify-between gap-3 bg-card hover:border-border transition-colors text-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${app.iconBg} flex items-center justify-center font-bold text-sm shrink-0`}>
                      {app.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{app.name}</p>
                      <p className="text-[10px] text-muted-foreground">{app.category}</p>
                    </div>
                  </div>
                  {app.connected ? (
                    <Badge variant="outline" className="text-[10px] font-bold text-primary bg-primary/10 border-primary/20">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
                      Not Connected
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  {app.description}
                </p>

                {app.account && (
                  <p className="text-[11px] font-medium text-foreground/80">
                    Linked: <span className="font-mono text-primary">{app.account}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-border/40 flex justify-end">
                <Button
                  variant={app.connected ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleToggle(app.id)}
                  className="text-xs font-semibold h-8"
                >
                  {app.connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CRMCard>

      {/* Developer API & Webhooks */}
      <CRMCard>
        <div className="pb-4 border-b border-border/50">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            Developer API & Inbound Webhooks
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Authenticate custom scripts and ingest leads programmatically into ClixProCRM.
          </p>
        </div>

        <div className="space-y-4 pt-4 text-xs">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Live Production API Secret Key</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={apiKey}
                className="font-mono text-xs h-9 bg-muted/40"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyApiKey}
                className="gap-1.5 text-xs h-9 shrink-0"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Inbound Webhook Endpoint URL</Label>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="font-mono text-xs h-9"
            />
          </div>
        </div>
      </CRMCard>
    </div>
  );
}
