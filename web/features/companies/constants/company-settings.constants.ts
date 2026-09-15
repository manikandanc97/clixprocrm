export interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "url" | "select" | "date" | "boolean" | "currency";
  required: boolean;
  options?: string;
}

export interface StandardFieldConfig {
  id: string;
  label: string;
  type: string;
  description: string;
  visible: boolean;
  systemLocked?: boolean;
}

export const DEFAULT_INDUSTRIES = [
  "Technology & Software",
  "Healthcare & Pharma",
  "Financial Services & Banking",
  "Manufacturing & Industrial",
  "Retail & E-Commerce",
  "Real Estate & Construction",
  "Consulting & Professional",
  "Education & EdTech",
  "Logistics & Supply Chain",
  "Energy & Utilities",
  "Telecommunications",
  "Media & Entertainment",
];

export const DEFAULT_ACCOUNT_TYPES = [
  "Customer",
  "Prospect",
  "Partner",
  "Vendor",
  "Distributor",
];

export const INITIAL_STANDARD_FIELDS: StandardFieldConfig[] = [
  {
    id: "name",
    label: "Company Name",
    type: "Text",
    description: "Primary legal or trade name of the organization.",
    visible: true,
    systemLocked: true,
  },
  {
    id: "industry",
    label: "Industry Classification",
    type: "Select",
    description: "Sector classification based on workspace taxonomy.",
    visible: true,
  },
  {
    id: "accountType",
    label: "Account Type",
    type: "Select",
    description: "Business relationship role (Customer, Partner, Vendor, etc.).",
    visible: true,
  },
  {
    id: "website",
    label: "Website / Domain",
    type: "URL",
    description: "Corporate website domain for deduplication and enrichment.",
    visible: true,
  },
  {
    id: "phone",
    label: "Primary Phone",
    type: "Phone",
    description: "Direct switchboard or headquarters contact number.",
    visible: true,
  },
  {
    id: "email",
    label: "Corporate Email",
    type: "Email",
    description: "General inbound inquiry or billing contact email.",
    visible: true,
  },
  {
    id: "employeeCount",
    label: "Employee Headcount",
    type: "Select",
    description: "Workforce size tier (1-10, 11-50, 50-200, 200+).",
    visible: true,
  },
  {
    id: "annualRevenue",
    label: "Annual Revenue",
    type: "Currency",
    description: "Estimated annual turnover and commercial scale.",
    visible: true,
  },
  {
    id: "taxId",
    label: "Tax ID / GSTIN / PAN",
    type: "Text",
    description: "Corporate registration and tax identification for invoicing.",
    visible: true,
  },
  {
    id: "address",
    label: "Headquarters Address",
    type: "Text",
    description: "Physical headquarters or billing street address.",
    visible: true,
  },
  {
    id: "city",
    label: "City / Geographic Location",
    type: "Text",
    description: "Primary operating city and geographic jurisdiction.",
    visible: true,
  },
  {
    id: "accountSize",
    label: "Company Size / Account Tier",
    type: "Select (Enterprise / Mid-Market / SMB)",
    description: "Commercial account scale classification.",
    visible: true,
  },
];
