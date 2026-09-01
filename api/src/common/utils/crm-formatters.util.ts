export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  PROPOSAL_SENT: 'Proposal Sent',
  WON: 'Won',
  LOST: 'Lost',
};

export const PIPELINE_STAGE_LABELS: Record<string, string> = {
  NEW: 'New Lead',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal Sent',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
};

const CURRENCY_FORMATS: Record<string, { locale: string; currency: string }> = {
  INR: { locale: 'en-IN', currency: 'INR' },
};

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function toNumber(value: unknown): number {
  return Number(value || 0);
}

function getSupportedCurrency(value?: string | null): string {
  return 'INR';
}

export function formatCurrency(value: unknown, currency?: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function formatPercentage(
  value: number | string | null | undefined,
  digits = 0,
): string {
  const numValue = Number(value);
  const safeValue = Number.isFinite(numValue) ? numValue : 0;
  return `${safeValue.toFixed(digits)}%`;
}

export function calculateTrend(currentValue: number, previousValue: number) {
  const current = Number(currentValue) || 0;
  const previous = Number(previousValue) || 0;

  if (previous === 0) {
    if (current === 0) {
      return { change: '0.0%', positive: false, trend: 'neutral' as const };
    }
    return { change: '+100.0%', positive: true, trend: 'up' as const };
  }

  const delta =
    ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Number(delta.toFixed(1));

  if (rounded === 0) {
    return { change: '0.0%', positive: false, trend: 'neutral' as const };
  }

  return {
    change: `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}%`,
    positive: rounded > 0,
    trend: rounded > 0 ? ('up' as const) : ('down' as const),
  };
}

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatRelativeDate(
  date: string | number | Date | null | undefined,
  options: { fallback?: string } = {},
) {
  const { fallback = 'Not available' } = options;

  if (!date) return fallback;

  const now = new Date();
  const input = new Date(date);

  if (isNaN(input.getTime())) return fallback;

  const currentDayStart = startOfDay(now);
  const inputDayStart = startOfDay(input);
  const dayDifference = Math.round(
    (inputDayStart.getTime() - currentDayStart.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (dayDifference === 0) return 'Today';
  if (dayDifference === 1) return 'Tomorrow';
  if (dayDifference === -1) return 'Yesterday';
  if (dayDifference > 1 && dayDifference <= 6)
    return `In ${dayDifference} days`;
  if (dayDifference < -1 && dayDifference >= -6)
    return `${Math.abs(dayDifference)} days ago`;

  return longDateFormatter.format(input);
}

export function formatDate(
  date: string | number | Date | null | undefined,
  fallback = 'Not available',
) {
  if (!date) return fallback;
  const input = new Date(date);
  if (isNaN(input.getTime())) return fallback;
  return longDateFormatter.format(input);
}

export function getStatusLabel(labels: Record<string, string>, value: string) {
  return labels[value] || value;
}

export function getMonthRanges() {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return {
    currentMonthStart,
    nextMonthStart,
    previousMonthStart,
  };
}
