"use client";

import { ArrowRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Button } from "@/shared/ui/button";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useGlobalModalStore } from "@/shared/store/useGlobalModalStore";
import { PERMISSIONS } from "@/shared/lib/auth/rbac/permissions";

export default function CreateNewMenu() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { openModal } = useGlobalModalStore();

  const actions = [
    { label: "New Lead", iconName: "userPlus", iconColor: "text-emerald-500", path: "/leads?new=true", permission: PERMISSIONS.LEADS_CREATE },
    { label: "New Customer", iconName: "contacts", iconColor: "text-blue-500", path: "/customers?new=true", permission: PERMISSIONS.CUSTOMERS_CREATE },
    { label: "New Quote", iconName: "quotations", iconColor: "text-violet-500", path: "/quotations?new=true", permission: PERMISSIONS.QUOTATIONS_CREATE },
    { label: "New Task", iconName: "tasks", iconColor: "text-amber-500", path: "/tasks?new=true", permission: PERMISSIONS.TASKS_CREATE },
    { label: "New Deal", iconName: "deals", iconColor: "text-rose-500", path: "/pipeline?new=true", permission: PERMISSIONS.PIPELINE_CREATE },
    { label: "New Meeting", iconName: "calendar", iconColor: "text-orange-500", onClick: () => openModal("meeting"), permission: "leads.view" },
    { label: "New Employee", iconName: "employees", iconColor: "text-indigo-500", path: "/employees?new=true", permission: PERMISSIONS.EMPLOYEES_MANAGE },
    { label: "New Role", iconName: "roles", iconColor: "text-slate-500", path: "/role-management?new=true", permission: PERMISSIONS.ROLES_MANAGE },
  ].filter((action) => hasPermission(action.permission));

  if (actions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className="gap-1.5 font-semibold text-xs sm:text-sm px-3 sm:px-3.5 h-9 cursor-pointer"
        >
          <AppIcon name="plus" size={15} />
          <span className="hidden sm:inline font-semibold">Create New</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-xl p-1.5 shadow-elevated border-border bg-popover/95 backdrop-blur-xl" align="end" sideOffset={8}>
        <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
          Quick Actions
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        {actions.map((action) => (
          <DropdownMenuItem 
            key={action.label} 
            onClick={() => action.onClick ? action.onClick() : router.push(action.path!)}
            className="cursor-pointer py-2 px-2.5 rounded-lg hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary group flex items-center justify-between transition-all duration-150"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted/80 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/15 group-focus:bg-primary/15 transition-colors shrink-0">
                <AppIcon name={action.iconName} size={15} className={action.iconColor} />
              </div>
              <span className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary group-focus:text-primary transition-colors">
                {action.label}
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus:opacity-100 group-focus:translate-x-0 transition-all text-primary" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}












