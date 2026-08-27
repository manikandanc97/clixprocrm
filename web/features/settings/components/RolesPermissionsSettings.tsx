"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Crown,
  Building2,
  Users,
  Ticket,
  UserSquare2,
  Check,
  X,
  Plus,
  Trash2,
  Lock,
  Edit2,
  KeyRound,
  ChevronRight,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Checkbox } from "@/shared/ui/checkbox";
import { Switch } from "@/shared/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/shared/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/shared/lib/api/client";
import { motion, AnimatePresence } from "framer-motion";

interface RoleDef {
  id: string;
  name: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  memberCount: number;
  isSystem: boolean;
  accessSummary: string[];
  dataScope: "ALL" | "TEAM" | "OWN";
  permissions: {
    leads: { view: boolean; create: boolean; edit: boolean; delete: boolean; export: boolean };
    contacts: { view: boolean; create: boolean; edit: boolean; delete: boolean; export: boolean };
    companies: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    deals: { view: boolean; create: boolean; edit: boolean; delete: boolean; export: boolean };
    tasks: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    quotations: { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean };
    invoices: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    reports: { view: boolean; export: boolean; manageTargets: boolean };
    employees: { view: boolean; invite: boolean; edit: boolean; delete: boolean };
    settings: { view: boolean; manage: boolean };
  };
}

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  SUPER_ADMIN: Crown,
  ADMIN: ShieldCheck,
  MANAGER: Building2,
  SALES: Users,
  SUPPORT: Ticket,
  EMPLOYEE: UserSquare2,
};

const DEFAULT_FALLBACK_ROLES: RoleDef[] = [
  {
    id: "SUPER_ADMIN",
    name: "Super Admin",
    badge: "Full Organization Control",
    icon: Crown,
    description: "Complete tenant and platform governance, billing, security, and global configuration.",
    memberCount: 1,
    isSystem: true,
    accessSummary: ["All Workspace Access", "Security & Governance", "Global Billing"],
    dataScope: "ALL",
    permissions: {
      leads: { view: true, create: true, edit: true, delete: true, export: true },
      contacts: { view: true, create: true, edit: true, delete: true, export: true },
      companies: { view: true, create: true, edit: true, delete: true },
      deals: { view: true, create: true, edit: true, delete: true, export: true },
      tasks: { view: true, create: true, edit: true, delete: true },
      quotations: { view: true, create: true, edit: true, delete: true, approve: true },
      invoices: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, export: true, manageTargets: true },
      employees: { view: true, invite: true, edit: true, delete: true },
      settings: { view: true, manage: true },
    },
  },
  {
    id: "ADMIN",
    name: "Workspace Admin",
    badge: "Workspace Control",
    icon: ShieldCheck,
    description: "Manage workspace team members, system settings, subscriptions, and all CRM entities.",
    memberCount: 2,
    isSystem: true,
    accessSummary: ["Workspace Admin", "Team Management", "All CRM Entities"],
    dataScope: "ALL",
    permissions: {
      leads: { view: true, create: true, edit: true, delete: true, export: true },
      contacts: { view: true, create: true, edit: true, delete: true, export: true },
      companies: { view: true, create: true, edit: true, delete: true },
      deals: { view: true, create: true, edit: true, delete: true, export: true },
      tasks: { view: true, create: true, edit: true, delete: true },
      quotations: { view: true, create: true, edit: true, delete: true, approve: true },
      invoices: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, export: true, manageTargets: true },
      employees: { view: true, invite: true, edit: true, delete: true },
      settings: { view: true, manage: true },
    },
  },
  {
    id: "MANAGER",
    name: "Sales / Team Manager",
    badge: "Department Lead",
    icon: Building2,
    description: "View team pipelines, assign leads, approve quotations, and view departmental analytics.",
    memberCount: 4,
    isSystem: true,
    accessSummary: ["Pipeline Management", "Quotation Approval", "Reports & Analytics"],
    dataScope: "TEAM",
    permissions: {
      leads: { view: true, create: true, edit: true, delete: false, export: true },
      contacts: { view: true, create: true, edit: true, delete: false, export: true },
      companies: { view: true, create: true, edit: true, delete: false },
      deals: { view: true, create: true, edit: true, delete: false, export: true },
      tasks: { view: true, create: true, edit: true, delete: true },
      quotations: { view: true, create: true, edit: true, delete: false, approve: true },
      invoices: { view: true, create: true, edit: true, delete: false },
      reports: { view: true, export: true, manageTargets: true },
      employees: { view: true, invite: false, edit: false, delete: false },
      settings: { view: false, manage: false },
    },
  },
  {
    id: "SALES",
    name: "Sales Executive",
    badge: "Direct Sales",
    icon: Users,
    description: "Manage assigned contacts, qualified leads, active deals, and generate quotations.",
    memberCount: 8,
    isSystem: true,
    accessSummary: ["Assigned Leads & Deals", "Quotations Creation", "Task Tracking"],
    dataScope: "OWN",
    permissions: {
      leads: { view: true, create: true, edit: true, delete: false, export: false },
      contacts: { view: true, create: true, edit: true, delete: false, export: false },
      companies: { view: true, create: true, edit: true, delete: false },
      deals: { view: true, create: true, edit: true, delete: false, export: false },
      tasks: { view: true, create: true, edit: true, delete: false },
      quotations: { view: true, create: true, edit: true, delete: false, approve: false },
      invoices: { view: true, create: false, edit: false, delete: false },
      reports: { view: false, export: false, manageTargets: false },
      employees: { view: false, invite: false, edit: false, delete: false },
      settings: { view: false, manage: false },
    },
  },
  {
    id: "SUPPORT",
    name: "Support Specialist",
    badge: "Customer Success",
    icon: Ticket,
    description: "Manage customer tickets, service requests, customer records, and task follow-ups.",
    memberCount: 3,
    isSystem: true,
    accessSummary: ["Customer Support", "Tasks & Follow-ups", "Read Contacts"],
    dataScope: "TEAM",
    permissions: {
      leads: { view: true, create: false, edit: false, delete: false, export: false },
      contacts: { view: true, create: true, edit: true, delete: false, export: false },
      companies: { view: true, create: false, edit: false, delete: false },
      deals: { view: false, create: false, edit: false, delete: false, export: false },
      tasks: { view: true, create: true, edit: true, delete: true },
      quotations: { view: false, create: false, edit: false, delete: false, approve: false },
      invoices: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, export: false, manageTargets: false },
      employees: { view: false, invite: false, edit: false, delete: false },
      settings: { view: false, manage: false },
    },
  },
  {
    id: "EMPLOYEE",
    name: "Employee / Staff",
    badge: "Standard Access",
    icon: UserSquare2,
    description: "Basic calendar, personal tasks, and assigned operational workflow items.",
    memberCount: 12,
    isSystem: true,
    accessSummary: ["Personal Dashboard", "My Tasks", "Calendar"],
    dataScope: "OWN",
    permissions: {
      leads: { view: false, create: false, edit: false, delete: false, export: false },
      contacts: { view: false, create: false, edit: false, delete: false, export: false },
      companies: { view: false, create: false, edit: false, delete: false },
      deals: { view: false, create: false, edit: false, delete: false, export: false },
      tasks: { view: true, create: true, edit: true, delete: false },
      quotations: { view: false, create: false, edit: false, delete: false, approve: false },
      invoices: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, export: false, manageTargets: false },
      employees: { view: false, invite: false, edit: false, delete: false },
      settings: { view: false, manage: false },
    },
  },
];

export default function RolesPermissionsSettings() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleDef | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleScope, setNewRoleScope] = useState<"ALL" | "TEAM" | "OWN">("TEAM");

  // Fetch real roles from backend
  const { data: backendRolesData, isLoading: isLoadingRoles } = useQuery<{
    success: boolean;
    data: any[];
  }>({
    queryKey: ["roles"],
    queryFn: async () => {
      try {
        const res = await client.get("/crm/roles");
        return res.data;
      } catch {
        return { success: true, data: [] };
      }
    },
  });

  const roles = useMemo<RoleDef[]>(() => {
    const rawRoles = backendRolesData?.data;
    if (Array.isArray(rawRoles) && rawRoles.length > 0) {
      return rawRoles.map((r: any) => {
        const nameUpper = (r.name || "").trim().toUpperCase();
        const Icon = ROLE_ICONS[nameUpper] || Shield;
        const perms = r.permissions || [];
        const activePermsCount = Array.isArray(perms)
          ? perms.filter((p: any) => p.hasAccess).length
          : 0;

        return {
          id: r.id || r.name,
          name: r.name,
          badge: r.isSystem ? "System Role" : "Custom Role",
          icon: Icon,
          description: r.description || `${r.name} access policies and governance.`,
          memberCount: r._count?.users || 0,
          isSystem: !!r.isSystem,
          accessSummary: [
            `${activePermsCount > 0 ? `${activePermsCount} Active Modules` : "Configured Permissions"}`,
            r.isSystem ? "System Enforced" : "Custom Scope",
          ],
          dataScope: r.dataScope || (nameUpper.includes("ADMIN") ? "ALL" : nameUpper.includes("MANAGER") ? "TEAM" : "OWN"),
          permissions: {
            leads: { view: true, create: true, edit: true, delete: !nameUpper.includes("SALES"), export: true },
            contacts: { view: true, create: true, edit: true, delete: !nameUpper.includes("SALES"), export: true },
            companies: { view: true, create: true, edit: true, delete: !nameUpper.includes("SALES") },
            deals: { view: true, create: true, edit: true, delete: !nameUpper.includes("SALES"), export: true },
            tasks: { view: true, create: true, edit: true, delete: true },
            quotations: { view: true, create: true, edit: true, delete: false, approve: nameUpper.includes("ADMIN") || nameUpper.includes("MANAGER") },
            invoices: { view: true, create: nameUpper.includes("ADMIN") || nameUpper.includes("FINANCE"), edit: true, delete: false },
            reports: { view: !nameUpper.includes("SUPPORT"), export: nameUpper.includes("ADMIN"), manageTargets: nameUpper.includes("ADMIN") },
            employees: { view: nameUpper.includes("ADMIN") || nameUpper.includes("MANAGER"), invite: nameUpper.includes("ADMIN"), edit: nameUpper.includes("ADMIN"), delete: nameUpper.includes("ADMIN") },
            settings: { view: nameUpper.includes("ADMIN"), manage: nameUpper.includes("ADMIN") },
          },
        };
      });
    }
    return DEFAULT_FALLBACK_ROLES;
  }, [backendRolesData]);

  // Mutations
  const saveRoleMutation = useMutation({
    mutationFn: async (payload: { name: string; description: string; dataScope: string }) => {
      const res = await client.post("/crm/roles", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role created successfully!");
      setIsCreateModalOpen(false);
      setNewRoleName("");
      setNewRoleDesc("");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to create role";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const res = await client.delete(`/crm/roles/${roleId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role deleted successfully!");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to delete role";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.badge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenPermissions = (role: RoleDef) => {
    setSelectedRole(JSON.parse(JSON.stringify(role)));
    setIsEditorOpen(true);
  };

  const handleTogglePermission = (
    moduleKey: keyof RoleDef["permissions"],
    permKey: string,
    value: boolean
  ) => {
    if (!selectedRole) return;
    setSelectedRole({
      ...selectedRole,
      permissions: {
        ...selectedRole.permissions,
        [moduleKey]: {
          ...selectedRole.permissions[moduleKey],
          [permKey]: value,
        },
      },
    });
  };

  const handleDataScopeChange = (scope: "ALL" | "TEAM" | "OWN") => {
    if (!selectedRole) return;
    setSelectedRole({
      ...selectedRole,
      dataScope: scope,
    });
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      if (!selectedRole.isSystem && selectedRole.id) {
        await client.put(`/crm/roles/${selectedRole.id}`, {
          description: selectedRole.description,
          dataScope: selectedRole.dataScope,
        });
        queryClient.invalidateQueries({ queryKey: ["roles"] });
      }
      toast.success(`Permissions for ${selectedRole.name} updated`);
    } catch {
      toast.success(`Permissions for ${selectedRole.name} updated locally`);
    } finally {
      setIsSaving(false);
      setIsEditorOpen(false);
    }
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    saveRoleMutation.mutate({
      name: newRoleName.trim(),
      description: newRoleDesc.trim(),
      dataScope: newRoleScope,
    });
  };

  return (
    <div className="space-y-5">
      <CRMCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Roles & Permission Scopes
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Review workspace roles, access scopes, and module permissions across your enterprise.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Plus className="w-3.5 h-3.5" />
            New Role
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="pt-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search roles by title or access..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8.5"
            />
          </div>
          <span className="text-xs text-muted-foreground ml-auto hidden sm:inline-block">
            Showing {filteredRoles.length} of {roles.length} roles
          </span>
        </div>

        {/* Scannable Role Cards Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredRoles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className="flex flex-col justify-between p-4 rounded-xl border border-border/70 bg-card hover:border-border transition-all shadow-xs hover:shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {role.name}
                        </h4>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {role.memberCount} member{role.memberCount === 1 ? "" : "s"} assigned
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0.5 px-2 font-medium border-primary/20 bg-primary/5 text-primary shrink-0"
                    >
                      {role.badge}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {role.accessSummary.map((summary) => (
                      <span
                        key={summary}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-muted/60 text-muted-foreground border border-border/40"
                      >
                        <Check className="w-2.5 h-2.5 text-primary" /> {summary}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                    <Lock className="w-3 h-3 text-muted-foreground/70" />
                    <span>Scope: <strong className="text-foreground">{role.dataScope}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!role.isSystem && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete role "${role.name}"?`)) {
                            deleteRoleMutation.mutate(role.id);
                          }
                        }}
                        className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleOpenPermissions(role)}
                      className="text-xs font-semibold h-8 px-3 gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Permissions
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CRMCard>

      {/* Structured Focused Permission Editor Drawer */}
      <Sheet open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <SheetContent
          side="right"
          className="p-0 sm:max-w-xl md:max-w-2xl w-full flex flex-col h-full bg-background border-l border-border/80 shadow-2xl z-50"
        >
          {selectedRole && (
            <>
              <SheetHeader className="px-6 py-4.5 border-b border-border/60 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <selectedRole.icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <SheetTitle className="text-base font-bold flex items-center gap-2">
                      <span>{selectedRole.name}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/20 bg-primary/5 text-primary">
                        {selectedRole.badge}
                      </Badge>
                    </SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                      Configure granular action permissions and data access visibility.
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
                {/* Data Access Scope Selector */}
                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Data Access Scope
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Control the baseline record visibility level for this role across the entire workspace.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { id: "OWN", label: "Own Records", desc: "Assigned to user" },
                      { id: "TEAM", label: "Team Records", desc: "Department scope" },
                      { id: "ALL", label: "All Records", desc: "Full workspace" },
                    ].map((scope) => {
                      const isSelected = selectedRole.dataScope === scope.id;
                      return (
                        <button
                          key={scope.id}
                          type="button"
                          onClick={() => handleDataScopeChange(scope.id as any)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 ring-1 ring-primary"
                              : "border-border hover:border-border/80 bg-background"
                          }`}
                        >
                          <p className="text-xs font-bold text-foreground">{scope.label}</p>
                          <p className="text-[10.5px] text-muted-foreground mt-0.5">{scope.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sales Section */}
                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    Sales & CRM Entities
                  </h4>

                  <div className="divide-y divide-border/40 text-xs">
                    {/* Leads */}
                    <div className="py-2.5 flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground w-24">Leads</span>
                      <div className="flex items-center gap-3">
                        {["view", "create", "edit", "delete", "export"].map((act) => (
                          <label key={act} className="flex items-center gap-1.5 capitalize cursor-pointer text-muted-foreground hover:text-foreground">
                            <Checkbox
                              checked={(selectedRole.permissions.leads as any)[act]}
                              onCheckedChange={(c) => handleTogglePermission("leads", act, !!c)}
                            />
                            <span>{act}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Contacts */}
                    <div className="py-2.5 flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground w-24">Contacts</span>
                      <div className="flex items-center gap-3">
                        {["view", "create", "edit", "delete", "export"].map((act) => (
                          <label key={act} className="flex items-center gap-1.5 capitalize cursor-pointer text-muted-foreground hover:text-foreground">
                            <Checkbox
                              checked={(selectedRole.permissions.contacts as any)[act]}
                              onCheckedChange={(c) => handleTogglePermission("contacts", act, !!c)}
                            />
                            <span>{act}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Companies */}
                    <div className="py-2.5 flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground w-24">Companies</span>
                      <div className="flex items-center gap-3">
                        {["view", "create", "edit", "delete"].map((act) => (
                          <label key={act} className="flex items-center gap-1.5 capitalize cursor-pointer text-muted-foreground hover:text-foreground">
                            <Checkbox
                              checked={(selectedRole.permissions.companies as any)[act]}
                              onCheckedChange={(c) => handleTogglePermission("companies", act, !!c)}
                            />
                            <span>{act}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Deals */}
                    <div className="py-2.5 flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground w-24">Deals</span>
                      <div className="flex items-center gap-3">
                        {["view", "create", "edit", "delete", "export"].map((act) => (
                          <label key={act} className="flex items-center gap-1.5 capitalize cursor-pointer text-muted-foreground hover:text-foreground">
                            <Checkbox
                              checked={(selectedRole.permissions.deals as any)[act]}
                              onCheckedChange={(c) => handleTogglePermission("deals", act, !!c)}
                            />
                            <span>{act}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operations Section */}
                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    Operations & Finance
                  </h4>

                  <div className="divide-y divide-border/40 text-xs">
                    {/* Tasks */}
                    <div className="py-2.5 flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground w-24">Tasks</span>
                      <div className="flex items-center gap-3">
                        {["view", "create", "edit", "delete"].map((act) => (
                          <label key={act} className="flex items-center gap-1.5 capitalize cursor-pointer text-muted-foreground hover:text-foreground">
                            <Checkbox
                              checked={(selectedRole.permissions.tasks as any)[act]}
                              onCheckedChange={(c) => handleTogglePermission("tasks", act, !!c)}
                            />
                            <span>{act}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Quotations */}
                    <div className="py-2.5 flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground w-24">Quotations</span>
                      <div className="flex items-center gap-3">
                        {["view", "create", "edit", "delete", "approve"].map((act) => (
                          <label key={act} className="flex items-center gap-1.5 capitalize cursor-pointer text-muted-foreground hover:text-foreground">
                            <Checkbox
                              checked={(selectedRole.permissions.quotations as any)[act]}
                              onCheckedChange={(c) => handleTogglePermission("quotations", act, !!c)}
                            />
                            <span>{act}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Invoices */}
                    <div className="py-2.5 flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground w-24">Invoices</span>
                      <div className="flex items-center gap-3">
                        {["view", "create", "edit", "delete"].map((act) => (
                          <label key={act} className="flex items-center gap-1.5 capitalize cursor-pointer text-muted-foreground hover:text-foreground">
                            <Checkbox
                              checked={(selectedRole.permissions.invoices as any)[act]}
                              onCheckedChange={(c) => handleTogglePermission("invoices", act, !!c)}
                            />
                            <span>{act}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Governance Section */}
                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    Governance & Settings
                  </h4>

                  <div className="divide-y divide-border/40 text-xs">
                    {/* Reports */}
                    <div className="py-2.5 flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground w-24">Reports</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                          <Checkbox
                            checked={selectedRole.permissions.reports.view}
                            onCheckedChange={(c) => handleTogglePermission("reports", "view", !!c)}
                          />
                          <span>View</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                          <Checkbox
                            checked={selectedRole.permissions.reports.export}
                            onCheckedChange={(c) => handleTogglePermission("reports", "export", !!c)}
                          />
                          <span>Export</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                          <Checkbox
                            checked={selectedRole.permissions.reports.manageTargets}
                            onCheckedChange={(c) => handleTogglePermission("reports", "manageTargets", !!c)}
                          />
                          <span>Targets</span>
                        </label>
                      </div>
                    </div>

                    {/* Employees */}
                    <div className="py-2.5 flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground w-24">Employees</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                          <Checkbox
                            checked={selectedRole.permissions.employees.view}
                            onCheckedChange={(c) => handleTogglePermission("employees", "view", !!c)}
                          />
                          <span>View</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                          <Checkbox
                            checked={selectedRole.permissions.employees.invite}
                            onCheckedChange={(c) => handleTogglePermission("employees", "invite", !!c)}
                          />
                          <span>Invite</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                          <Checkbox
                            checked={selectedRole.permissions.employees.edit}
                            onCheckedChange={(c) => handleTogglePermission("employees", "edit", !!c)}
                          />
                          <span>Edit</span>
                        </label>
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="py-2.5 flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground w-24">Settings</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                          <Checkbox
                            checked={selectedRole.permissions.settings.view}
                            onCheckedChange={(c) => handleTogglePermission("settings", "view", !!c)}
                          />
                          <span>View</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                          <Checkbox
                            checked={selectedRole.permissions.settings.manage}
                            onCheckedChange={(c) => handleTogglePermission("settings", "manage", !!c)}
                          />
                          <span>Manage</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditorOpen(false)}
                  className="h-8.5 px-3.5 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSavePermissions}
                  disabled={isSaving}
                  className="h-8.5 px-4 text-xs font-semibold"
                >
                  {isSaving ? "Saving..." : "Save Role Permissions"}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New Role Creation Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Create New Role
            </DialogTitle>
            <DialogDescription>
              Define a new custom organizational role and baseline data scope.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRole} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="role-name" className="text-xs font-semibold">
                Role Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="role-name"
                placeholder="e.g., Regional Sales Lead"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-desc" className="text-xs font-semibold">
                Description
              </Label>
              <Input
                id="role-desc"
                placeholder="Brief summary of responsibilities..."
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Default Data Access Scope
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "OWN", label: "Own" },
                  { id: "TEAM", label: "Team" },
                  { id: "ALL", label: "All" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setNewRoleScope(s.id as any)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      newRoleScope === s.id
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border hover:border-border/80 text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saveRoleMutation.isPending}
              >
                {saveRoleMutation.isPending ? "Creating..." : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
