// customer types

import { MetricCardType } from "./common";

export interface CustomerType {
  id: string;
  name: string;
  company: string;
  companyId?: string | null;
  email: string;
  status: "PREMIUM" | "ACTIVE" | "INACTIVE";
  revenue: string;
  revenueValue: number;
  lastContact: string;
  lastContactAt: string | null;
  // Relationship Intelligence Fields
  healthScore: number; // 0-100
  ltv: string; // Lifetime Value
  totalInteractions: number;
  revenueTrend: "up" | "down" | "stable";
  segment: "VIP" | "Enterprise" | "SMB" | "Growth";
  renewalDate?: string;
  lastPurchaseDate?: string;
  churnRisk: "Low" | "Medium" | "High";
  sentiment: "Positive" | "Neutral" | "Negative";
  aiSummary: string;
}

export interface CustomersDataType {
  stats: MetricCardType[];
  customers: CustomerType[];
}











