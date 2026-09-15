export interface Stage {
  id: string;
  name: string;
  probability: number;
  slaDays: number;
  color: string;
  type: "OPEN" | "WON" | "LOST";
  isSystem?: boolean;
}

export interface CustomDealField {
  id: string;
  name: string;
  key: string;
  type: "text" | "number" | "date" | "select" | "currency";
  required: boolean;
  options?: string[];
}

export interface StandardFieldConfig {
  id: string;
  name: string;
  type: string;
  required: boolean;
  isSystemRequired: boolean;
  visible: boolean;
  description: string;
}

export const DEFAULT_STAGES: Stage[] = [
  { id: "lead_in", name: "Lead In / Discovery", probability: 10, slaDays: 3, color: "bg-blue-500", type: "OPEN" },
  { id: "qualified", name: "Contact Made / Qualified", probability: 30, slaDays: 5, color: "bg-indigo-500", type: "OPEN" },
  { id: "proposal", name: "Proposal Sent", probability: 60, slaDays: 7, color: "bg-amber-500", type: "OPEN" },
  { id: "negotiation", name: "Negotiation", probability: 80, slaDays: 4, color: "bg-purple-500", type: "OPEN" },
  { id: "won", name: "Closed Won", probability: 100, slaDays: 0, color: "bg-emerald-500", type: "WON", isSystem: true },
  { id: "lost", name: "Closed Lost", probability: 0, slaDays: 0, color: "bg-rose-500", type: "LOST", isSystem: true },
];

export const DEFAULT_STANDARD_FIELDS: StandardFieldConfig[] = [
  { id: "name", name: "Deal Name", type: "Text", required: true, isSystemRequired: true, visible: true, description: "Primary title of the opportunity." },
  { id: "value", name: "Deal Amount", type: "Currency", required: true, isSystemRequired: false, visible: true, description: "Estimated total contract or revenue value." },
  { id: "expectedCloseDate", name: "Target Close Date", type: "Date", required: true, isSystemRequired: false, visible: true, description: "Expected closure date for forecasting." },
  { id: "source", name: "Deal Source", type: "Dropdown", required: true, isSystemRequired: false, visible: true, description: "Channel or campaign attribution." },
  { id: "company", name: "Associated Company", type: "Relation", required: false, isSystemRequired: false, visible: true, description: "Organization linked to the opportunity." },
  { id: "customer", name: "Primary Contact", type: "Relation", required: false, isSystemRequired: false, visible: true, description: "Primary decision-maker or contact person." },
  { id: "owner", name: "Deal Owner", type: "User", required: true, isSystemRequired: true, visible: true, description: "Assigned sales executive or representative." },
  { id: "stage", name: "Pipeline Stage", type: "Stage", required: true, isSystemRequired: true, visible: true, description: "Current progression phase in sales pipeline." },
  { id: "probability", name: "Win Probability", type: "Percentage", required: false, isSystemRequired: false, visible: true, description: "Estimated percentage likelihood of winning." },
  { id: "competitor", name: "Competitor", type: "Text", required: false, isSystemRequired: false, visible: true, description: "Key rival vendor competing for the account." },
  { id: "lostReason", name: "Lost Reason", type: "Dropdown", required: true, isSystemRequired: false, visible: true, description: "Classification category when deal is lost." },
];

export const DEFAULT_CUSTOM_FIELDS: CustomDealField[] = [
  { id: "cf_deal_type", name: "Deal Type", key: "deal_type", type: "select", required: false, options: ["New Business", "Renewal", "Upsell / Expansion"] },
  { id: "cf_contract_term", name: "Contract Term (Months)", key: "contract_term", type: "number", required: false },
  { id: "cf_region", name: "Sales Region", key: "sales_region", type: "select", required: false, options: ["North America", "EMEA", "APAC", "Domestic"] },
];

export const COLOR_PRESETS = [
  { name: "Blue", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Amber", value: "bg-amber-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Emerald", value: "bg-emerald-500" },
  { name: "Cyan", value: "bg-cyan-500" },
  { name: "Rose", value: "bg-rose-500" },
];
