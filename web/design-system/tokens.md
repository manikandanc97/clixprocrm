# Design Tokens — ClixProCRM

Design tokens are the foundational atomic values of the ClixProCRM Design System. They map directly to CSS custom properties declared in `web/app/globals.css` and bound through Tailwind CSS v4 `@theme inline`.

---

## 1. Token Taxonomy

Tokens are organized into three distinct tiers:
1. **Primitive Tokens**: Mathematical values (OKLCH color coordinates, rem scales, pixel radiuses).
2. **Semantic Tokens**: Functional designations (`--primary`, `--surface-muted`, `--border`, `--destructive`).
3. **Component Tokens**: Context-specific bindings (`--crm-control-height`, `--crm-card-radius`, `--crm-table-header-h`).

---

## 2. Global Core Tokens

### Elevation & Surfaces

| Token | Light Value | Dark Value | Purpose |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(0.985 0.002 247)` | `oklch(0.12 0.015 265)` | Application root background |
| `--foreground` | `oklch(0.145 0.015 255)` | `oklch(0.93 0.01 265)` | Default text & primary elements |
| `--card` / `--surface` | `oklch(1 0 0)` | `oklch(0.16 0.018 265)` | Panels, cards, contained modules |
| `--card-foreground` | `oklch(0.145 0.015 255)` | `oklch(0.93 0.01 265)` | Card primary text |
| `--surface-muted` | `oklch(0.96 0.004 250)` | `oklch(0.20 0.018 265)` | Table headers, secondary toolbars |
| `--surface-elevated` | `oklch(1 0 0)` | `oklch(0.19 0.02 265)` | Modals, flyouts, dropdown menus |
| `--popover` | `oklch(1 0 0)` | `oklch(0.16 0.018 265)` | Radix popover & dropdown background |
| `--popover-foreground` | `oklch(0.145 0.015 255)` | `oklch(0.93 0.01 265)` | Popover text |

### Semantic Colors

| Token | Light Value | Dark Value | Purpose |
| :--- | :--- | :--- | :--- |
| `--primary` | `oklch(0.58 0.165 157)` | `oklch(0.68 0.16 157)` | Brand emerald (#32bd87 aligned), CTAs |
| `--primary-foreground` | `oklch(0.99 0.005 157)` | `oklch(0.12 0.015 265)` | Text inside primary buttons/badges |
| `--secondary` | `oklch(0.95 0.008 255)` | `oklch(0.20 0.02 265)` | Secondary actions & neutral fills |
| `--secondary-foreground`| `oklch(0.35 0.02 255)` | `oklch(0.85 0.012 265)` | Text on secondary elements |
| `--muted` | `oklch(0.96 0.004 250)` | `oklch(0.20 0.018 265)` | Inactive tab backgrounds, subtle fills |
| `--muted-foreground` | `oklch(0.52 0.015 255)` | `oklch(0.58 0.015 265)` | Subtitles, helper text, empty states |
| `--accent` | `oklch(0.96 0.02 250)` | `oklch(0.25 0.05 157)` | Hover highlights, active list rows |
| `--accent-foreground` | `var(--primary)` | `oklch(0.85 0.1 157)` | Highlighted text |
| `--destructive` | `oklch(0.58 0.22 25)` | `oklch(0.65 0.22 25)` | Critical alerts, delete actions |
| `--destructive-foreground` | `oklch(0.99 0.005 25)` | `oklch(0.99 0.005 25)` | Text on destructive buttons |
| `--success` | `oklch(0.58 0.165 157)` | `oklch(0.65 0.16 157)` | Won deals, active users, completed |
| `--warning` | `oklch(0.72 0.18 65)` | `oklch(0.76 0.18 65)` | Pending tasks, trial notices, limits |
| `--info` | `oklch(0.55 0.18 220)` | `oklch(0.62 0.18 220)` | Telemetry, guidance pills, info tips |

### Borders & Rings

| Token | Light Value | Dark Value | Purpose |
| :--- | :--- | :--- | :--- |
| `--border` | `oklch(0.91 0.008 255)` | `oklch(0.24 0.018 265)` | Card borders, dividers, table lines |
| `--border-subtle` | `oklch(0.91 0.008 255 / 0.5)` | `oklch(0.24 0.018 265 / 0.5)` | Internal cell borders, soft separators |
| `--input` | `oklch(0.91 0.008 255)` | `oklch(0.24 0.018 265)` | Form input resting border |
| `--ring` | `oklch(0.58 0.165 157)` | `oklch(0.68 0.16 157)` | Focus visible outline halo (2px, offset) |

---

## 3. Radius Scale

| Token | CSS Class | Value | Canonical Usage |
| :--- | :--- | :--- | :--- |
| `--radius-xs` | `rounded-xs` | `4px` | Tags, micro-badges, checkbox/radio |
| `--radius-sm` | `rounded-sm` | `6px` | Sub-controls, small dropdown items |
| `--radius-md` | `rounded-md` | `8px` | Default buttons, inputs, selects |
| `--radius-lg` | `rounded-lg` | `10px` | Secondary panels, icon boxes, tabs |
| `--radius-xl` | `rounded-xl` | `12px` | Primary cards, content modules, table wrappers |
| `--radius-2xl`| `rounded-2xl` | `16px` | Modals, drawers, command palette |
| `--radius-full`| `rounded-full` | `9999px` | User avatars, status pills, count chips |

---

## 4. Shadow System

| Token | CSS Class | Value (Light) | Purpose |
| :--- | :--- | :--- | :--- |
| `--shadow-none` | `shadow-none` | `none` | Flat contained elements, inner tables |
| `--shadow-xs` | `shadow-xs` | `0 1px 2px oklch(0 0 0 / 0.04)` | Buttons, select triggers, inputs |
| `--shadow-card` | `shadow-card` | `0 1px 3px oklch(0 0 0 / 0.04), 0 1px 2px -1px oklch(0 0 0 / 0.03)` | Resting CRM cards & tables |
| `--shadow-card-hover` | `shadow-card-hover` | `0 4px 12px -2px oklch(0 0 0 / 0.06), 0 2px 4px -2px oklch(0 0 0 / 0.03)` | Hovered cards & clickable items |
| `--shadow-elevated` | `shadow-elevated` | `0 10px 30px -10px oklch(0 0 0 / 0.08), 0 4px 10px -5px oklch(0 0 0 / 0.04)` | Modals, flyouts, popovers |
| `--shadow-overlay` | `shadow-2xl` | `0 25px 50px -12px oklch(0 0 0 / 0.25)` | Drawers, fullscreen dialogs |

---

## 5. Standard Component Sizing Tokens

| Component Target | Size Scale | Height / Value | Canonical Class |
| :--- | :--- | :--- | :--- |
| **Buttons / Inputs / Selects** | `xs` | `28px` (`1.75rem`) | `h-7 text-xs px-2` |
| | `sm` | `32px` (`2.0rem`) | `h-8 text-xs px-3` |
| | `default` (md) | `36px` (`2.25rem`) | `h-9 text-xs px-3.5` (CRM Standard) |
| | `lg` | `40px` (`2.5rem`) | `h-10 text-sm px-4` |
| **Table Header Row** | Fixed | `40px` (`2.5rem`) | `h-10 text-xs font-bold` |
| **Table Data Row** | Compact | `48px` (`3.0rem`) | `h-12 text-xs` |
| | Comfortable | `56px` (`3.5rem`) | `h-14 sm:h-16 text-xs` (Default) |
| **Badges / Status Pills** | `sm` | `20px` (`1.25rem`) | `h-5 text-[10px] px-2` |
| | `default` | `24px` (`1.5rem`) | `h-6 text-[10px] px-2.5` |
| **Avatars** | `sm` | `24px` | `size-6 text-[10px]` |
| | `default` | `32px` | `size-8 text-xs` |
| | `lg` | `40px` | `size-10 text-sm` |
| **Icon Boxes** | `default` | `36px` | `size-9 rounded-lg` |
