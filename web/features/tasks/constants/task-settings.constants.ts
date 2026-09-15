export interface TaskTypeDef {
  id: string;
  name: string;
  active: boolean;
  isSystem?: boolean;
  defaultDueDays?: number;
}

export interface TaskStatusDef {
  id: string;
  name: string;
  key: string;
  color: string;
  isSystem?: boolean;
  isTerminal?: boolean;
  active: boolean;
}

export interface PriorityDef {
  id: string;
  key: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  label: string;
  slaHours: number;
  color: string;
  active: boolean;
}

export const DEFAULT_TYPES: TaskTypeDef[] = [
  { id: "type_1", name: "Client Follow-up Call", active: true, isSystem: true, defaultDueDays: 1 },
  { id: "type_2", name: "Product Demonstration", active: true, isSystem: true, defaultDueDays: 2 },
  { id: "type_3", name: "Quotation Review", active: true, isSystem: true, defaultDueDays: 2 },
  { id: "type_4", name: "Discovery Meeting", active: true, isSystem: true, defaultDueDays: 3 },
  { id: "type_5", name: "Contract Signing", active: true, isSystem: true, defaultDueDays: 5 },
  { id: "type_6", name: "Email Outreach", active: true, isSystem: false, defaultDueDays: 1 },
  { id: "type_7", name: "Customer Support Request", active: true, isSystem: false, defaultDueDays: 1 },
];

export const DEFAULT_STATUSES: TaskStatusDef[] = [
  { id: "st_1", name: "Pending", key: "PENDING", color: "bg-amber-500", isSystem: true, isTerminal: false, active: true },
  { id: "st_2", name: "In Progress", key: "IN_PROGRESS", color: "bg-blue-500", isSystem: true, isTerminal: false, active: true },
  { id: "st_3", name: "Blocked", key: "BLOCKED", color: "bg-rose-500", isSystem: true, isTerminal: false, active: true },
  { id: "st_4", name: "Completed", key: "COMPLETED", color: "bg-emerald-500", isSystem: true, isTerminal: true, active: true },
  { id: "st_5", name: "Cancelled", key: "CANCELLED", color: "bg-slate-500", isSystem: true, isTerminal: true, active: true },
  { id: "st_6", name: "Overdue", key: "OVERDUE", color: "bg-red-600", isSystem: true, isTerminal: false, active: true },
];

export const DEFAULT_PRIORITIES: PriorityDef[] = [
  { id: "p_urgent", key: "URGENT", label: "Urgent", slaHours: 4, color: "bg-rose-600", active: true },
  { id: "p_high", key: "HIGH", label: "High", slaHours: 24, color: "bg-amber-500", active: true },
  { id: "p_medium", key: "MEDIUM", label: "Medium", slaHours: 72, color: "bg-blue-500", active: true },
  { id: "p_low", key: "LOW", label: "Low", slaHours: 168, color: "bg-slate-400", active: true },
];

export const TASK_COLOR_PRESETS = [
  { name: "Emerald", value: "bg-emerald-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Amber", value: "bg-amber-500" },
  { name: "Rose", value: "bg-rose-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Cyan", value: "bg-cyan-500" },
  { name: "Slate", value: "bg-slate-500" },
];
