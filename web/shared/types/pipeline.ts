// pipeline types

export enum DealStage {
  NEW = "NEW",
  QUALIFIED = "QUALIFIED",
  PROPOSAL = "PROPOSAL",
  NEGOTIATION = "NEGOTIATION",
  WON = "WON",
  LOST = "LOST",
}

export interface PipelineMetricType {
  title: string;
  value: string;
  valueAmount?: number;
  change?: string;
  positive?: boolean;
  trend?: "up" | "down" | "neutral";
  sparklineData?: { value: number }[];
}

export interface PipelineLeadType {
  id: string;
  name: string;
  company: string;
  value: string;
  valueAmount: number;
  followUp: string;
  followUpAt: string | null;
  stage: DealStage | string;
  // Deal Intelligence
  priority: "High" | "Medium" | "Low";
  probability: number;
  temperature: "Hot" | "Warm" | "Cold";
  expectedCloseDate: string;
  activityCount: number;
  isStuck: boolean;
  aiSummary: string;
  createdAt?: string;
  wonReason?: string;
  wonDate?: string;
  actualRevenue?: number;
  lostReason?: string;
  competitor?: string;
  notes?: string;
}

export interface PipelineDataType {
  stats: PipelineMetricType[];
  items: PipelineLeadType[];
}











