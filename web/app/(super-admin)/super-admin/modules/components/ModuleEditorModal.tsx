"use client";

import React from "react";
import { Search, Lock, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Badge } from "@/shared/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
import { getDynamicIcon, DynamicIcon } from "@/shared/lib/icons/dynamic-icon";
import { PlatformModule } from "@/shared/lib/api/super-admin.api";

interface ModuleEditorModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  editingModule: PlatformModule | null;
  activeScope: "tenant" | "platform";
  formLabel: string;
  handleLabelChange: (label: string) => void;
  formRoute: string;
  setFormRoute: (route: string) => void;
  formGroup: string;
  setFormGroup: (group: string) => void;
  customGroup: string;
  setCustomGroup: (group: string) => void;
  availableGroups: string[];
  formOrder: number | "";
  setFormOrder: (order: number) => void;
  formAccessPreset: "ALL" | "ADMIN_ONLY" | "MANAGER_ADMIN" | "CUSTOM";
  setFormAccessPreset: (preset: "ALL" | "ADMIN_ONLY" | "MANAGER_ADMIN" | "CUSTOM") => void;
  formPermission: string;
  setFormPermission: (perm: string) => void;
  formIcon: string;
  setFormIcon: (icon: string) => void;
  iconSearchQuery: string;
  setIconSearchQuery: (query: string) => void;
  filteredIcons: string[];
  formIsEnabled: boolean;
  setFormIsEnabled: (enabled: boolean) => void;
  formBadge: string;
  setFormBadge: (badge: string) => void;
  formDescription: string;
  setFormDescription: (desc: string) => void;
  saving: boolean;
  handleSaveModule: (e: React.FormEvent) => void;
}

export function ModuleEditorModal({
  isModalOpen,
  setIsModalOpen,
  editingModule,
  activeScope,
  formLabel,
  handleLabelChange,
  formRoute,
  setFormRoute,
  formGroup,
  setFormGroup,
  customGroup,
  setCustomGroup,
  availableGroups,
  formOrder,
  setFormOrder,
  formAccessPreset,
  setFormAccessPreset,
  formPermission,
  setFormPermission,
  formIcon,
  setFormIcon,
  iconSearchQuery,
  setIconSearchQuery,
  filteredIcons,
  formIsEnabled,
  setFormIsEnabled,
  formBadge,
  setFormBadge,
  formDescription,
  setFormDescription,
  saving,
  handleSaveModule,
}: ModuleEditorModalProps) {
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto rounded-2xl border-border bg-card shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <DynamicIcon name={formIcon} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold text-foreground">
                  {editingModule ? "Edit Navigation Menu" : "Add Navigation Menu"}
                </DialogTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {activeScope === "tenant" ? "Tenant CRM" : "Super Admin"}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Configure menu details, route path, icon, group, access level, and status.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSaveModule} className="space-y-4 pt-2">
          {/* BASIC: Display Name & Route */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="menu-label" className="text-xs font-bold text-foreground">
                Menu Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="menu-label"
                placeholder="Enter module name"
                value={formLabel}
                onChange={(e) => handleLabelChange(e.target.value)}
                required
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="menu-route" className="text-xs font-bold text-foreground">
                Route Path <span className="text-destructive">*</span>
              </Label>
              <Input
                id="menu-route"
                placeholder={activeScope === "platform" ? "/super-admin/section" : "/section"}
                value={formRoute}
                onChange={(e) => setFormRoute(e.target.value)}
                required
                className="h-9 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          {/* ORGANIZATION: Group & Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="menu-group" className="text-xs font-bold text-foreground">
                Navigation Group
              </Label>
              <Select 
                value={formGroup} 
                onValueChange={(val) => setFormGroup(val)}
              >
                <SelectTrigger id="menu-group" className="w-full h-9 px-3 border-input bg-background text-xs font-medium">
                  <SelectValue placeholder="Select Navigation Group" />
                </SelectTrigger>
                <SelectContent>
                  {availableGroups.map((grp) => (
                    <SelectItem key={grp} value={grp}>
                      {grp}
                    </SelectItem>
                  ))}
                  <SelectItem value="CUSTOM">Custom Group...</SelectItem>
                </SelectContent>
              </Select>
              {formGroup === "CUSTOM" && (
                <Input
                  placeholder="Enter custom group name"
                  value={customGroup}
                  onChange={(e) => setCustomGroup(e.target.value)}
                  className="h-8 mt-1.5 rounded-xl text-xs"
                  autoFocus
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="menu-order" className="text-xs font-bold text-foreground">
                Order Index
              </Label>
              <Input
                id="menu-order"
                type="number"
                min="1"
                value={formOrder}
                onChange={(e) => setFormOrder(parseInt(e.target.value) || 1)}
                className="h-9 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          {/* ACCESS CONTROL */}
          {activeScope === "tenant" ? (
            <div className="space-y-1.5">
              <Label htmlFor="access-preset" className="text-xs font-bold text-foreground">
                Access Level
              </Label>
              <Select 
                value={formAccessPreset} 
                onValueChange={(val) => setFormAccessPreset(val as "ALL" | "ADMIN_ONLY" | "MANAGER_ADMIN" | "CUSTOM")}
              >
                <SelectTrigger id="access-preset" className="w-full h-9 px-3 border-input bg-background text-xs font-medium">
                  <SelectValue placeholder="Select Access Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All CRM Users (Standard Access)</SelectItem>
                  <SelectItem value="ADMIN_ONLY">Admin Only</SelectItem>
                  <SelectItem value="MANAGER_ADMIN">Manager &amp; Admin</SelectItem>
                  <SelectItem value="CUSTOM">Custom RBAC Permission...</SelectItem>
                </SelectContent>
              </Select>
              {formAccessPreset === "CUSTOM" && (
                <Input
                  placeholder="Enter custom permission key (e.g. Invoices, Reports)"
                  value={formPermission}
                  onChange={(e) => setFormPermission(e.target.value)}
                  className="h-8 mt-1.5 rounded-xl text-xs font-mono"
                  autoFocus
                />
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-800 dark:text-purple-300 flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
              <span>Super Admin Root Access (AAL2 MFA assurance required)</span>
            </div>
          )}

          {/* ICON PICKER */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Icon <span className="text-muted-foreground font-normal">({formIcon})</span>
              </Label>
              <div className="relative w-36">
                <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search icons..."
                  value={iconSearchQuery}
                  onChange={(e) => setIconSearchQuery(e.target.value)}
                  className="h-7 pl-7 text-[11px] rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-8 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60 max-h-32 overflow-y-auto">
              {filteredIcons.map((iconName) => {
                const IconComp = getDynamicIcon(iconName);
                const isSelected = formIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setFormIcon(iconName)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg transition-all cursor-pointer",
                      isSelected
                        ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    title={iconName}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* SINGLE UNIFIED STATUS TOGGLE */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/60">
            <div>
              <p className="text-xs font-bold text-foreground">Menu Status</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formIsEnabled
                  ? "Active — Enabled and visible in sidebar navigation"
                  : "Inactive — Disabled and hidden from sidebar navigation"}
              </p>
            </div>
            <Switch
              checked={formIsEnabled}
              onCheckedChange={setFormIsEnabled}
              className="data-[state=checked]:bg-emerald-600 cursor-pointer"
            />
          </div>

          {/* Optional Description / Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="menu-badge" className="text-xs font-bold text-foreground">
                Badge Text <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="menu-badge"
                placeholder="Enter badge text"
                value={formBadge}
                onChange={(e) => setFormBadge(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="menu-description" className="text-xs font-bold text-foreground">
                Description <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="menu-description"
                placeholder="Brief menu purpose"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="h-9 rounded-xl text-xs font-medium cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : editingModule ? (
                "Update Menu"
              ) : (
                "Create Menu"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
