/**
 * ClixProCRM Design System — Token Reference
 *
 * Canonical primitive class compositions built from design tokens.
 * Components should import from here instead of composing ad-hoc class strings.
 *
 * IMPORTANT: All classes here must use semantic tokens (bg-primary, text-primary,
 * border-border, etc.) NOT hardcoded Tailwind color families.
 */

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------
export const crmRadius = {
  card: "rounded-xl",     // 12px — primary cards, content modules
  modal: "rounded-2xl",   // 16px — modals, drawers
  control: "rounded-md",  // 8px  — buttons, inputs, selects
  item: "rounded-md",     // 8px  — secondary controls
  tag: "rounded-sm",      // 6px  — tags, sub-controls
  pill: "rounded-full",   // 9999px — avatars, status pills
} as const;

// ---------------------------------------------------------------------------
// Surface compositions
// ---------------------------------------------------------------------------
export const crmSurface = {
  card:
    "rounded-xl border border-border bg-card text-card-foreground shadow-card",
  interactive:
    "transition-all duration-200 hover:border-primary/30 hover:shadow-card-hover",
  mutedPanel: "rounded-xl border border-border bg-muted/40",
  elevated:
    "rounded-2xl border border-border bg-surface-elevated shadow-elevated",
} as const;

// ---------------------------------------------------------------------------
// Control sizing — aligned to tokens.md component sizing table
// ---------------------------------------------------------------------------
export const crmControl = {
  /** h-7 — inline table actions */
  xs: "h-7 rounded-md border border-input bg-background px-2 text-xs font-medium shadow-xs transition-colors",
  /** h-8 — toolbar buttons, header secondary actions */
  sm: "h-8 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-xs transition-colors",
  /** h-9 — CRM standard: primary page CTAs, form submits */
  base: "h-9 rounded-md border border-input bg-background px-3.5 text-xs font-medium shadow-xs transition-colors",
  /** h-10 — onboarding / billing upgrade CTAs */
  lg: "h-10 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors",
  /** Icon box — 36px */
  iconBox:
    "flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground shadow-xs",
} as const;

// ---------------------------------------------------------------------------
// State classes — reusable interactive state tokens
// ---------------------------------------------------------------------------
export const crmState = {
  resting: "border-border bg-card shadow-xs",
  hover: "hover:border-primary/40 hover:shadow-card-hover",
  active: "active:bg-muted/80",
  focusVisible:
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  disabled: "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
  invalid: "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  selected: "data-[state=selected]:bg-primary/[0.04]",
} as const;

// ---------------------------------------------------------------------------
// Table sizing tokens
// ---------------------------------------------------------------------------
export const crmTable = {
  headerRow: "h-10 text-xs font-bold",
  dataRowCompact: "h-12 text-xs",
  dataRowDefault: "h-14 sm:h-16 text-xs",
} as const;

// ---------------------------------------------------------------------------
// Badge sizing tokens
// ---------------------------------------------------------------------------
export const crmBadge = {
  sm: "h-5 text-[10px] px-2",
  default: "h-6 text-[10px] px-2.5",
} as const;

// ---------------------------------------------------------------------------
// Avatar sizing tokens
// ---------------------------------------------------------------------------
export const crmAvatar = {
  sm: "size-6 text-[10px]",
  default: "size-8 text-xs",
  lg: "size-10 text-sm",
} as const;
