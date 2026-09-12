import { MetricCardType } from "./common";

export interface QuotationItemType {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  price: number;
  rate?: number;
  unitPrice?: number;
  discount?: number;
  taxRate?: number;
  total?: number;
  [key: string]: unknown;
}

export interface QuotationType {
  id: string;
  quoteId?: string;
  quoteNumber?: string;
  customerId?: string | null;
  dealId?: string | null;
  client: string;
  amount: string;
  amountValue: number;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | string;
  validTill: string;
  validTillValue: string | null;
  leadId?: string;
  leadName?: string;
  leadDetails?: {
    name: string;
    email: string;
    phone: string | null;
    company: string;
  };
  isSigned?: boolean;
  notes?: string | null;
  items?: QuotationItemType[];
  tax?: number;
  discount?: number;
  lastActivity?: string;
}

export interface QuotationsDataType {
  stats: MetricCardType[];
  quotations: QuotationType[];
}











