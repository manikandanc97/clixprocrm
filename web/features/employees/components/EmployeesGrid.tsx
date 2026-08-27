"use client";

import React from "react";
import { 
  MoreVertical, 
  User, 
  Edit2, 
  Trash2, 
  Power, 
  Mail, 
  Calendar
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/shared/ui/dropdown-menu";
import { CRMCard, CRMStatusBadge } from "@/shared/components/crm";

interface EmployeesGridProps {
  employees: ReturnType<typeof JSON.parse>[];
  onViewDetails: (emp: ReturnType<typeof JSON.parse>) => void;
  onEdit: (emp: ReturnType<typeof JSON.parse>) => void;
  onDelete: (emp: ReturnType<typeof JSON.parse>) => void;
  onToggleStatus: (emp: ReturnType<typeof JSON.parse>) => void;
}

const getSafeStr = (val: unknown) => (typeof val === 'string' ? val : typeof val === 'object' && val !== null ? (val as Record<string, unknown>).name as string || '' : String(val || ''));

export const EmployeesGrid: React.FC<EmployeesGridProps> = ({
  employees,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-6">
      {employees.map((emp, idx) => (
        <CRMCard
          key={emp.id}
          delay={idx * 0.04}
          className="group relative flex flex-col justify-between p-5"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 rounded-xl border-2 border-background shadow-sm">
                  <AvatarImage src={""} alt={emp.name} />
                  <AvatarFallback className="font-bold text-sm bg-primary/10 text-primary">
                    {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-base tracking-tight cursor-pointer" onClick={() => onViewDetails(emp)}>
                    {emp.name}
                  </h3>
                  <p className="text-xs font-semibold capitalize text-muted-foreground">{getSafeStr(emp.role).toLowerCase()}</p>
                </div>
              </div>

              <CRMStatusBadge tone={emp.status === 'ACTIVE' ? 'success' : 'warning'}>
                {emp.status}
              </CRMStatusBadge>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-2.5 mb-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Mail className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <span className="truncate">{emp.email || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <span>Joined {new Date(emp.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem onClick={() => onViewDetails(emp)} className="text-xs font-medium cursor-pointer">
                  <User className="w-3.5 h-3.5 mr-2" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(emp)} className="text-xs font-medium cursor-pointer">
                  <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Employee
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onToggleStatus(emp)} className="text-xs font-medium cursor-pointer">
                  <Power className="w-3.5 h-3.5 mr-2" /> {emp.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(emp)} className="text-xs font-medium cursor-pointer text-destructive focus:text-destructive">
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Employee
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CRMCard>
      ))}
    </div>
  );
};
