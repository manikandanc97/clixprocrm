/**
 * ClixProCRM Enterprise Design System V2 — Chart & Visualization Token Architecture
 *
 * Provides centralized semantic tokens and helpers for Recharts and SVG data visualizations.
 * All palette items resolve dynamically to CSS variables, ensuring automatic compatibility
 * with light mode, dark mode, and tenant accent switching.
 */

export const CHART_PALETTE: readonly string[] = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
] as const;

export const SEMANTIC_CHART_COLORS = {
  positive: "var(--chart-positive)",
  negative: "var(--chart-negative)",
  neutral: "var(--chart-neutral)",
  warning: "var(--chart-warning)",
  comparison: "var(--chart-comparison)",
  forecast: "var(--chart-forecast)",
  primary: "var(--primary)",
  muted: "var(--muted-foreground)",
} as const;

export type SemanticChartRole = keyof typeof SEMANTIC_CHART_COLORS;

/**
 * Returns a CSS variable color from the chart palette by index (cycles through the 6 palette colors).
 */
export function getChartColor(index: number): string {
  return CHART_PALETTE[Math.abs(index) % CHART_PALETTE.length];
}

/**
 * Returns the CSS variable corresponding to a semantic chart role.
 */
export function getSemanticChartColor(role: SemanticChartRole): string {
  return SEMANTIC_CHART_COLORS[role] || "var(--primary)";
}
