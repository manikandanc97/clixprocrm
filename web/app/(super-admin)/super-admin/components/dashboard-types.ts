export type TimeframeOption = "7D" | "30D" | "90D" | "1Y";

export const DEFAULT_ORGANIZATION_GROWTH = {
  newOrganizations: 4,
  activatedOrganizations: 3,
  churnedOrganizations: 0,
  growthPercent: 8.2,
  timeframes: {
    "7D": [
      { label: "Mon", organizations: 1, total: 22, active: 20 },
      { label: "Tue", organizations: 2, total: 23, active: 21 },
      { label: "Wed", organizations: 1, total: 23, active: 21 },
      { label: "Thu", organizations: 3, total: 24, active: 22 },
      { label: "Fri", organizations: 2, total: 24, active: 22 },
      { label: "Sat", organizations: 1, total: 25, active: 23 },
      { label: "Sun", organizations: 2, total: 25, active: 24 },
    ],
    "30D": [
      { label: "Week 1", organizations: 3, total: 21, active: 19 },
      { label: "Week 2", organizations: 5, total: 22, active: 20 },
      { label: "Week 3", organizations: 4, total: 23, active: 21 },
      { label: "Week 4", organizations: 6, total: 24, active: 22 },
      { label: "Week 5", organizations: 8, total: 25, active: 24 },
    ],
    "90D": [
      { label: "Month 1", organizations: 8, total: 16, active: 14 },
      { label: "Month 2", organizations: 12, total: 20, active: 18 },
      { label: "Month 3", organizations: 15, total: 25, active: 23 },
    ],
    "1Y": [
      { label: "Q1", organizations: 10, total: 10, active: 9 },
      { label: "Q2", organizations: 16, total: 15, active: 14 },
      { label: "Q3", organizations: 22, total: 20, active: 18 },
      { label: "Q4", organizations: 28, total: 25, active: 23 },
    ],
  },
};

export const formatINR = (amount: number) => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  return `₹${amount.toLocaleString()}`;
};
