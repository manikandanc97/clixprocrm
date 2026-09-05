export interface CRMField {
  key: string;
  label: string;
  required: boolean;
  advanced: boolean;
}

export const CRM_FIELDS: CRMField[] = [
  { key: "name", label: "Full Name *", required: true, advanced: false },
  { key: "company", label: "Company", required: false, advanced: false },
  { key: "email", label: "Email Address *", required: true, advanced: false },
  { key: "phone", label: "Phone Number", required: false, advanced: false },
  { key: "status", label: "Status (e.g., New Lead)", required: false, advanced: false },
  { key: "priority", label: "Priority", required: false, advanced: false },
  { key: "valueAmount", label: "Deal Value", required: false, advanced: false },
  { key: "probability", label: "Probability (%)", required: false, advanced: false },
  { key: "country", label: "Country", required: false, advanced: true },
  { key: "state", label: "State", required: false, advanced: true },
  { key: "city", label: "City", required: false, advanced: true },
  { key: "source", label: "Lead Source", required: false, advanced: true },
  { key: "pipeline", label: "Pipeline", required: false, advanced: true },
  { key: "currency", label: "Currency", required: false, advanced: true },
  { key: "assignedTo", label: "Assigned To", required: false, advanced: true },
  { key: "tags", label: "Tags", required: false, advanced: true },
  { key: "notes", label: "Notes", required: false, advanced: true },
];

export const AUTO_MAP: Record<string, string> = {
  "first name": "name",
  "full name": "name",
  "full name *": "name",
  name: "name",
  company: "company",
  organization: "company",
  email: "email",
  "email *": "email",
  "email address": "email",
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  value: "valueAmount",
  "deal value": "valueAmount",
  amount: "valueAmount",
  status: "status",
  stage: "status",
  priority: "priority",
  probability: "probability",
  country: "country",
  state: "state",
  city: "city",
  "lead source": "source",
  source: "source",
  pipeline: "pipeline",
  currency: "currency",
  "assigned to": "assignedTo",
  owner: "assignedTo",
  tags: "tags",
  labels: "tags",
  notes: "notes",
  description: "notes",
  remarks: "notes",
};

export const IMPORT_STEPS = [
  { num: 1, label: "Upload File" },
  { num: 2, label: "Map Columns" },
  { num: 3, label: "Validate Data" },
  { num: 4, label: "Import" },
];

import type { Variants } from "framer-motion";

export const slideVariants: Variants = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.2 } },
};

export type DuplicateStrategy = "skip" | "update" | "create";

export interface ImportFailedRow {
  [key: string]: unknown;
  ErrorReason?: string;
}

export interface ImportSummaryData {
  imported: number;
  skipped: number;
  failed: number;
  failedRows: ImportFailedRow[];
}
