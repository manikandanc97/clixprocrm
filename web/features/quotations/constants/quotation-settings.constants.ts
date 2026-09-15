export interface TemplateOption {
  id: string;
  name: string;
  description: string;
  badge?: string;
}

export const TEMPLATES: TemplateOption[] = [
  {
    id: "modern",
    name: "Modern Minimal",
    description: "Clean typography with emerald accents and structured summary blocks.",
    badge: "Recommended",
  },
  {
    id: "classic",
    name: "Classic Professional",
    description: "Traditional corporate layout with bordered tables and header crest.",
  },
  {
    id: "compact",
    name: "Enterprise Compact",
    description: "High data-density layout ideal for multi-line item quotations.",
  },
];

export const CURRENCIES = [
  { code: "INR", label: "INR (₹) - Indian Rupee" },
  { code: "USD", label: "USD ($) - US Dollar" },
  { code: "EUR", label: "EUR (€) - Euro" },
  { code: "GBP", label: "GBP (£) - British Pound" },
  { code: "AED", label: "AED (د.إ) - UAE Dirham" },
  { code: "CAD", label: "CAD ($) - Canadian Dollar" },
  { code: "AUD", label: "AUD ($) - Australian Dollar" },
  { code: "SGD", label: "SGD ($) - Singapore Dollar" },
];

export const PAYMENT_PRESETS = [
  { value: "DUE_ON_RECEIPT", label: "Due on Receipt" },
  { value: "NET15", label: "Net 15 Days" },
  { value: "NET30", label: "Net 30 Days" },
  { value: "NET60", label: "Net 60 Days" },
  { value: "ADVANCE_50_50", label: "50% Advance / 50% on Delivery" },
  { value: "ADVANCE_100", label: "100% Advance Payment" },
  { value: "CUSTOM", label: "Custom Stated Terms" },
];
