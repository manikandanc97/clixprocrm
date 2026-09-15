"use client";

import React from "react";
import { Zap, Lock, RefreshCw, ShieldCheck } from "lucide-react";

export function TrustFaqSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
      <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex items-start gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">Instant Activation</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Upgrades and additional seats take effect immediately without system downtime.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">Enterprise Security</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            256-bit SSL encrypted transactions with bank-grade payment processing.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex items-start gap-3">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
          <RefreshCw className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">Prorated Seat Billing</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Add or remove team members at any point during your billing period seamlessly.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">Cancel Anytime</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            No locked-in lock-in contracts. Switch between monthly or annual tiers easily.
          </p>
        </div>
      </div>
    </div>
  );
}
