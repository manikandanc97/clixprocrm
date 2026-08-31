export const crmRadius = {
  card: "rounded-xl",
  modal: "rounded-xl",
  control: "rounded-lg",
  item: "rounded-md",
  pill: "rounded-full",
} as const;

export const crmSurface = {
  card:
    "rounded-xl border border-border bg-card text-card-foreground shadow-none",
  interactive:
    "transition-all duration-200 hover:border-primary/30",
  mutedPanel: "rounded-xl border border-border bg-muted/40",
} as const;

export const crmControl = {
  base:
    "h-10 rounded-lg border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors",
  iconBox:
    "flex size-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground shadow-sm",
} as const;











