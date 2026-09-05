"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { cn } from "@/shared/lib/utils";
import { EmployeeType } from "@/shared/types/employee";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { getSafeEmployeeStr } from "../hooks/use-employees-data";

interface EmployeeDetailsDialogProps {
  employee: EmployeeType | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmployeeDetailsDialog: React.FC<EmployeeDetailsDialogProps> = ({
  employee,
  isOpen,
  onOpenChange,
}) => {
  if (!employee) return null;

  const name = getSafeEmployeeStr(employee.name);
  const email = getSafeEmployeeStr(employee.email);
  const role = getSafeEmployeeStr(employee.role);
  const color = getOrgAvatarColor(name || email || "Employee");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-xs border shrink-0",
                color.bg,
                color.text,
                color.border
              )}
            >
              {name ? name.charAt(0).toUpperCase() : "E"}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-bold text-foreground truncate">
                {name || "Employee Details"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                {email || "No email provided"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
            <div>
              <span className="text-muted-foreground text-[11px]">Role</span>
              <p className="font-semibold text-foreground mt-0.5 truncate">{role || "Employee"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px]">Status</span>
              <p className="font-semibold text-foreground mt-0.5">{employee.status || "ACTIVE"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px]">Joined Date</span>
              <p className="font-semibold text-foreground mt-0.5">
                {employee.createdAt
                  ? new Date(employee.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px]">Staff ID</span>
              <p className="font-semibold text-foreground mt-0.5 font-mono truncate">{employee.id}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
