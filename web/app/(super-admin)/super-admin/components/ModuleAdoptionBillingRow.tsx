"use client";

import React from "react";
import Link from "next/link";
import { Layers, CreditCard, ArrowUpRight, Target, ChevronRight } from "lucide-react";
import { formatINR } from "./dashboard-types";

interface ModuleItem {
  module: string;
  key: string;
  rate: number;
  recordCount?: number;
}

interface BillingSnapshotShape {
  mrr: number;
  arr: number;
  paidOrganizations: number;
  trialOrganizations: number;
  pastDueCount: number;
  pastDueAmount: number;
  currency?: string;
}

interface TenantHealthShape {
  healthyCount: number;
  atRiskCount: number;
  inactiveCount: number;
  healthyPercent?: number;
}

interface ModuleAdoptionBillingRowProps {
  moduleAdoption: ModuleItem[];
  billingSnapshot: BillingSnapshotShape;
  tenantHealth: TenantHealthShape;
  totalOrganizations: number;
}

export function ModuleAdoptionBillingRow({
  moduleAdoption,
  billingSnapshot,
  tenantHealth,
  totalOrganizations,
}: ModuleAdoptionBillingRowProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Module Adoption (1 col) */}
      <div className="rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              Module Adoption
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">
            Cross-Tenant
          </span>
        </div>

        <div className="space-y-2.5 flex-1">
          {moduleAdoption.map((mod) => (
            <div key={mod.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-foreground">{mod.module}</span>
                <span className="text-muted-foreground font-mono font-bold text-[11px]">
                  {mod.rate}%
                </span>
              </div>
              <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${mod.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border/40 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            8 Core Modules Active
          </span>
          <Link
            href="/super-admin/modules"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
          >
            <span>Manage Modules</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Billing Snapshot & Tenant Health (2 cols) */}
      <div className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 flex flex-col justify-between space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 border border-violet-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Billing Overview &amp; Tenant Health
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Subscription run-rates, invoice receivables, and tenant operational stability
              </p>
            </div>
          </div>

          <Link
            href="/super-admin/billing"
            className="text-xs font-bold text-violet-600 hover:text-violet-700 inline-flex items-center gap-1 shrink-0"
          >
            <span>View Billing</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Billing KPIs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              Monthly Run Rate
            </span>
            <p className="text-lg font-black text-foreground">
              {formatINR(billingSnapshot.mrr)}
            </p>
            <span className="text-[10px] text-emerald-600 font-bold">
              +12.4% vs last mo
            </span>
          </div>

          <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              Projected ARR
            </span>
            <p className="text-lg font-black text-foreground">
              {formatINR(billingSnapshot.arr)}
            </p>
            <span className="text-[10px] text-muted-foreground">
              Annual Run Rate
            </span>
          </div>

          <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              Paid / Trial Orgs
            </span>
            <p className="text-lg font-black text-foreground">
              {billingSnapshot.paidOrganizations}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {billingSnapshot.trialOrganizations}
              </span>
            </p>
            <span className="text-[10px] text-indigo-600 font-bold">
              {billingSnapshot.paidOrganizations} active paid
            </span>
          </div>

          <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              Past Due Invoices
            </span>
            <p
              className={`text-lg font-black ${
                billingSnapshot.pastDueCount > 0 ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {billingSnapshot.pastDueCount}
            </p>
            <span className="text-[10px] text-muted-foreground">
              {billingSnapshot.pastDueAmount > 0
                ? formatINR(billingSnapshot.pastDueAmount)
                : "0 overdue"}
            </span>
          </div>
        </div>

        {/* Tenant Health Bar */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tenant Stability Distribution</span>
            </span>
            <span className="text-muted-foreground font-normal text-[11px]">
              {totalOrganizations} Total Workspaces
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-semibold text-foreground">Healthy</span>
              <span className="ml-auto font-black text-emerald-700 dark:text-emerald-400">
                {tenantHealth.healthyCount}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="font-semibold text-foreground">At Risk</span>
              <span className="ml-auto font-black text-amber-700 dark:text-amber-400">
                {tenantHealth.atRiskCount}
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
              <span className="font-semibold text-foreground">Inactive</span>
              <span className="ml-auto font-black text-slate-700 dark:text-slate-400">
                {tenantHealth.inactiveCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
