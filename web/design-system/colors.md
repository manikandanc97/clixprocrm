# Color System — ClixProCRM

The ClixProCRM Color System is formulated in the **OKLCH** color space to guarantee perceptual uniformity, predictable contrast ratios, and seamless light/dark mode transitions across tenant and administrative applications.

---

## 1. Palette Architecture

Every color used in ClixProCRM belongs to one of four semantic layers:
1. **Neutral Base**: Surfaces, cards, dividers, text (`--background`, `--foreground`, `--card`, `--border`, `--muted`).
2. **Brand Identity**: Emerald primary (`--primary`, `--primary-foreground`), calibrated to the ClixProCRM official logo emblem (`#32bd87`).
3. **Semantic Status**: Direct feedback for CRM states (`--success`, `--warning`, `--destructive`, `--info`).
4. **Theme Accents**: User/tenant selectable primary accents (Emerald, Blue, Violet, Amber, Rose, Indigo, Purple, Red, Teal, Cyan).

---

## 2. Light & Dark Mode Tokens

### 2.1 Neutral Surfaces

```css
/* LIGHT MODE */
--background: oklch(0.985 0.002 247);        /* Crisp light slate canvas */
--foreground: oklch(0.145 0.015 255);        /* High contrast primary slate */
--card: oklch(1 0 0);                        /* Pure white elevated surface */
--card-foreground: oklch(0.145 0.015 255);
--muted: oklch(0.96 0.004 250);              /* Soft neutral surface fill */
--muted-foreground: oklch(0.52 0.015 255);   /* Secondary & placeholder text */
--border: oklch(0.91 0.008 255);             /* Subtle crisp perimeter lines */
--border-subtle: oklch(0.91 0.008 255 / 0.5);

/* DARK MODE */
--background: oklch(0.12 0.015 265);        /* Deep obsidian canvas */
--foreground: oklch(0.93 0.01 265);         /* Crisp legible off-white */
--card: oklch(0.16 0.018 265);              /* Elevated dark slate panel */
--card-foreground: oklch(0.93 0.01 265);
--muted: oklch(0.20 0.018 265);             /* Inactive dark surface fill */
--muted-foreground: oklch(0.58 0.015 265);  /* Readable dark secondary text */
--border: oklch(0.24 0.018 265);            /* Defined dark divider */
--border-subtle: oklch(0.24 0.018 265 / 0.5);
```

### 2.2 Semantic Status System

Semantic colors follow strict contrast guarantees for both light and dark modes:

| Status Role | Light Background | Light Foreground | Dark Background | Dark Foreground |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `oklch(0.58 0.165 157 / 0.12)` | `oklch(0.48 0.165 157)` | `oklch(0.65 0.16 157 / 0.18)` | `oklch(0.78 0.14 157)` |
| **Warning** | `oklch(0.72 0.18 65 / 0.14)` | `oklch(0.48 0.15 65)` | `oklch(0.76 0.18 65 / 0.18)` | `oklch(0.85 0.14 65)` |
| **Destructive** | `oklch(0.58 0.22 25 / 0.12)` | `oklch(0.52 0.22 25)` | `oklch(0.65 0.22 25 / 0.18)` | `oklch(0.82 0.18 25)` |
| **Info** | `oklch(0.55 0.18 220 / 0.12)` | `oklch(0.46 0.18 220)` | `oklch(0.62 0.18 220 / 0.18)` | `oklch(0.80 0.15 220)` |

---

## 3. Dynamic Accent Overrides

ClixProCRM supports dynamic tenant-level or user-level accent themes via `data-accent="<name>"`.

```
data-accent="emerald" (Default Brand)
data-accent="blue"
data-accent="violet"
data-accent="amber"
data-accent="rose"
data-accent="indigo"
data-accent="purple"
data-accent="red"
data-accent="teal"
data-accent="cyan"
```

### Golden Rule of Theme Overrides
When an accent changes, the entire UI must reflect the change dynamically.
- **NEVER** write hardcoded Tailwind classes like `bg-emerald-50`, `border-emerald-500/20`, or `text-emerald-600` on core tables, buttons, or headers.
- **ALWAYS** use `bg-primary/10`, `border-primary/20`, `text-primary`, or `hover:bg-primary/90`.

---

## 4. Anti-Patterns & Prohibitions

❌ **DO NOT USE**:
- Raw hex codes in JSX: `bg-[#0f172a]`, `text-[#059669]`, `border-[#e2e8f0]`.
- Ad-hoc pastel backgrounds in metric cards: `bg-[#d7f4e3]`, `bg-[#ece3fc]`, `bg-[#fef3c7]`.
- Direct un-themed Tailwind color classes (`bg-green-600`, `text-blue-500`, `bg-red-500`) where semantic tokens (`bg-primary`, `text-info`, `text-destructive`) apply.
- Hardcoded dark-mode backgrounds: `dark:bg-[#050505]`, `dark:bg-[#08090a]`. Use `dark:bg-background`.
