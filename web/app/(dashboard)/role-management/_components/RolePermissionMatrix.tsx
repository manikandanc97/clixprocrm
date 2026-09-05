"use client";

import React from "react";
import { Building, Calendar, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import { usePlatformNavigation } from "@/shared/hooks/use-platform-navigation";

export const DEFAULT_PERMISSION_CATEGORIES = [
  {
    name: "CRM & Sales",
    icon: Building,
    modules: [
      { id: "Dashboard", label: "Dashboard" },
      { id: "Contacts", label: "Contacts" },
      { id: "Companies", label: "Companies" },
      { id: "Deals", label: "Deals" },
      { id: "Quotations", label: "Quotations" },
    ],
  },
  {
    name: "Operations",
    icon: Calendar,
    modules: [
      { id: "Tasks", label: "Tasks" },
      { id: "Calendar", label: "Calendar" },
    ],
  },
  {
    name: "Analytics & HRM",
    icon: Sparkles,
    modules: [
      { id: "Reports", label: "Reports & Analytics" },
      { id: "Attendance", label: "Attendance" },
      { id: "Performance", label: "Performance" },
      { id: "Support Tickets", label: "Support Tickets" },
    ],
  },
  {
    name: "Administration",
    icon: ShieldCheck,
    modules: [
      { id: "Employees", label: "Employees" },
      { id: "Roles", label: "Role Management" },
      { id: "Settings", label: "Settings" },
    ],
  },
];

export const PERMISSION_CATEGORIES = DEFAULT_PERMISSION_CATEGORIES;

interface RolePermissionMatrixProps {
  permissions: string[];
  onChange: (permissions: string[]) => void;
  isSystemAdminRole?: boolean;
  roleName?: string;
}

export function RolePermissionMatrix({
  permissions,
  onChange,
  isSystemAdminRole,
  roleName,
}: RolePermissionMatrixProps) {
  const { rawModules } = usePlatformNavigation();

  // Dynamically build categories based on active platform modules if available
  const permissionCategories = React.useMemo(() => {
    if (!rawModules || rawModules.length === 0) {
      return DEFAULT_PERMISSION_CATEGORIES;
    }

    const groupMap = new Map<string, { id: string; label: string }[]>();
    const groupOrder: string[] = [];

    for (const mod of rawModules) {
      const groupName = mod.group || "Core";
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, []);
        groupOrder.push(groupName);
      }
      groupMap.get(groupName)!.push({
        id: mod.permission || mod.label,
        label: mod.label,
      });
    }

    return groupOrder.map((groupName) => {
      let icon = Building;
      if (groupName.toLowerCase().includes("operation") || groupName.toLowerCase().includes("core")) {
        icon = Calendar;
      } else if (groupName.toLowerCase().includes("admin")) {
        icon = ShieldCheck;
      } else if (groupName.toLowerCase().includes("insight") || groupName.toLowerCase().includes("hrm")) {
        icon = Sparkles;
      }

      return {
        name: groupName,
        icon,
        modules: groupMap.get(groupName) || [],
      };
    });
  }, [rawModules]);

  const handleToggleModule = (moduleId: string, checked: boolean) => {
    if (checked) {
      onChange([...permissions, moduleId]);
    } else {
      onChange(permissions.filter((id) => id !== moduleId));
    }
  };

  const handleToggleCategory = (moduleIds: string[], selectAll: boolean) => {
    if (selectAll) {
      const next = Array.from(new Set([...permissions, ...moduleIds]));
      onChange(next);
    } else {
      onChange(permissions.filter((id) => !moduleIds.includes(id)));
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h4 className="text-sm font-bold text-foreground">
            Module Access Permissions
          </h4>
          <p className="text-xs text-muted-foreground">
            Toggle modules this role is authorized to view and interact with.
          </p>
        </div>

        {!isSystemAdminRole && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                const allModuleIds = permissionCategories.flatMap((c) =>
                  c.modules.map((m) => m.id),
                );
                onChange(allModuleIds);
              }}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onChange([])}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {isSystemAdminRole ? (
        <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="font-bold text-foreground text-sm">
            Unrestricted Workspace Access
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {roleName} has inherent full privileges across all CRM features,
            integrations, and administration settings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {permissionCategories.map((category) => {
            const catModuleIds = category.modules.map((m) => m.id);
            const allSelected = catModuleIds.every((id) =>
              permissions.includes(id),
            );

            return (
              <div
                key={category.name}
                className="border rounded-xl p-3.5 bg-card shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <category.icon className="h-4 w-4 text-primary" />
                    <h5 className="text-xs font-bold text-foreground uppercase tracking-wide">
                      {category.name}
                    </h5>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() =>
                      handleToggleCategory(catModuleIds, !allSelected)
                    }
                    className="text-[11px] h-6 px-2 text-muted-foreground hover:text-foreground"
                  >
                    {allSelected ? "Deselect Section" : "Select Section"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {category.modules.map((mod) => {
                    const isChecked = permissions.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left cursor-pointer transition-all select-none",
                          isChecked
                            ? "bg-primary/5 border-primary/40 text-foreground font-medium shadow-xs"
                            : "bg-muted/10 border-border text-muted-foreground hover:text-foreground hover:bg-muted/30",
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            handleToggleModule(mod.id, !!checked)
                          }
                        />
                        <span className="text-xs font-medium truncate">
                          {mod.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
