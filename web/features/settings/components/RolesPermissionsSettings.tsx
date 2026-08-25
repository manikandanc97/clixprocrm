"use client";

import React from "react";
import {
  ShieldCheck,
  Crown,
  Building2,
  Users,
  Ticket,
  UserSquare2,
  Check,
  X,
  ExternalLink,
  Lock,
} from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import Link from "next/link";

interface RoleDef {
  id: string;
  name: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  modules: {
    dashboard: boolean;
    contactsDeals: boolean;
    pipeline: boolean;
    quotations: boolean;
    reports: boolean;
    employees: boolean;
    settings: boolean;
  };
}

const ROLES_OVERVIEW: RoleDef[] = [
  {
    id: "SUPER_ADMIN",
    name: "Super Admin",
    badge: "Full Organization Control",
    icon: Crown,
    description: "Complete tenant and platform governance, billing, security, and global configuration.",
    modules: {
      dashboard: true,
      contactsDeals: true,
      pipeline: true,
      quotations: true,
      reports: true,
      employees: true,
      settings: true,
    },
  },
  {
    id: "ADMIN",
    name: "Workspace Admin",
    badge: "Workspace Control",
    icon: ShieldCheck,
    description: "Manage workspace team members, system settings, subscriptions, and all CRM entities.",
    modules: {
      dashboard: true,
      contactsDeals: true,
      pipeline: true,
      quotations: true,
      reports: true,
      employees: true,
      settings: true,
    },
  },
  {
    id: "MANAGER",
    name: "Sales / Team Manager",
    badge: "Department Lead",
    icon: Building2,
    description: "View team pipelines, assign leads, approve quotations, and view departmental analytics.",
    modules: {
      dashboard: true,
      contactsDeals: true,
      pipeline: true,
      quotations: true,
      reports: true,
      employees: false,
      settings: false,
    },
  },
  {
    id: "SALES",
    name: "Sales Executive",
    badge: "Direct Sales",
    icon: Users,
    description: "Manage assigned contacts, qualified leads, active deals, and generate quotations.",
    modules: {
      dashboard: true,
      contactsDeals: true,
      pipeline: true,
      quotations: true,
      reports: false,
      employees: false,
      settings: false,
    },
  },
  {
    id: "SUPPORT",
    name: "Support Specialist",
    badge: "Customer Success",
    icon: Ticket,
    description: "Manage customer tickets, service requests, customer records, and task follow-ups.",
    modules: {
      dashboard: true,
      contactsDeals: true,
      pipeline: false,
      quotations: false,
      reports: false,
      employees: false,
      settings: false,
    },
  },
  {
    id: "EMPLOYEE",
    name: "Employee / Staff",
    badge: "Standard Access",
    icon: UserSquare2,
    description: "Basic calendar, personal tasks, and assigned operational workflow items.",
    modules: {
      dashboard: true,
      contactsDeals: false,
      pipeline: false,
      quotations: false,
      reports: false,
      employees: false,
      settings: false,
    },
  },
];

export default function RolesPermissionsSettings() {
  return (
    <div className="space-y-6">
      {/* Header Info Card */}
      <CRMCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/50">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Roles & Permission Scopes
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Review workspace roles, access levels, and module permissions across your enterprise.
            </p>
          </div>
          <Button
            size="sm"
            asChild
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Link href="/role-management">
              <ExternalLink className="w-3.5 h-3.5" />
              Open Role Management
            </Link>
          </Button>
        </div>

        {/* Roles Matrix Table */}
        <div className="mt-5 border rounded-xl overflow-x-auto divide-y divide-border/50">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Role</th>
                <th className="py-3 px-3 text-center">Dashboard</th>
                <th className="py-3 px-3 text-center">Leads & Deals</th>
                <th className="py-3 px-3 text-center">Pipeline</th>
                <th className="py-3 px-3 text-center">Quotations</th>
                <th className="py-3 px-3 text-center">Reports</th>
                <th className="py-3 px-3 text-center">Employees</th>
                <th className="py-3 px-3 text-center">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {ROLES_OVERVIEW.map((role) => {
                const Icon = role.icon;
                return (
                  <tr key={role.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{role.name}</p>
                          <p className="text-[10px] text-muted-foreground">{role.badge}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <Check className="w-4 h-4 text-primary mx-auto" />
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {role.modules.contactsDeals ? (
                        <Check className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {role.modules.pipeline ? (
                        <Check className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {role.modules.quotations ? (
                        <Check className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {role.modules.reports ? (
                        <Check className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {role.modules.employees ? (
                        <Check className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {role.modules.settings ? (
                        <Check className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CRMCard>

      {/* Granular Permission Policies */}
      <CRMCard>
        <div className="pb-4 border-b border-border/50">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Security & Access Isolation Policies
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Enterprise boundary rules governing data privacy and multi-tenancy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
            <p className="font-semibold text-foreground">Record-Level Scoping</p>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              Sales representatives only see their assigned deals and contacts unless team-sharing is explicitly enabled.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
            <p className="font-semibold text-foreground">Quotation Approvals</p>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              Quotations exceeding the discount threshold require mandatory approval from a Workspace Admin or Sales Manager.
            </p>
          </div>
        </div>
      </CRMCard>
    </div>
  );
}
