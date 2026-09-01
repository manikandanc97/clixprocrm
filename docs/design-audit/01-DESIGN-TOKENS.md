# CRM Design System Audit — Design Tokens Extraction

> **Audit Date:** September 2026  
> **Repository:** `clixprocrm`  
> **Source Files Inspected:**  
> - [`web/app/globals.css`](file:///d:/Projects/project/clixprocrm/web/app/globals.css)  
> - [`web/shared/lib/design-system.ts`](file:///d:/Projects/project/clixprocrm/web/shared/lib/design-system.ts)  
> - [`web/shared/lib/motion.ts`](file:///d:/Projects/project/clixprocrm/web/shared/lib/motion.ts)  
> - [`web/shared/styles/button-icons.css`](file:///d:/Projects/project/clixprocrm/web/shared/styles/button-icons.css)  
> - [`web/components.json`](file:///d:/Projects/project/clixprocrm/web/components.json)  

---

## 1. Color System

The CRM frontend utilizes **Tailwind CSS v4** with CSS Variables defined via OKLCH color space in `@theme inline` and `:root` / `.dark` classes in [`web/app/globals.css`](file:///d:/Projects/project/clixprocrm/web/app/globals.css). Additionally, accent-theme overrides (`[data-accent="..."]`) are configured for tenant personalization.

### 1.1 Core Semantic Tokens

| Token Name | CSS Variable | Light Mode (OKLCH) | Dark Mode (OKLCH) | Effective Color Representation |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | `--background` | `oklch(0.985 0.002 247)` | `oklch(0.12 0.015 265)` | Ultra-light cool slate / Deep obsidian slate |
| **Foreground (Text)** | `--foreground` | `oklch(0.145 0.015 255)` | `oklch(0.93 0.01 265)` | Near-black slate / Soft white slate |
| **Card / Surface** | `--card` | `oklch(1 0 0)` | `oklch(0.16 0.018 265)` | Pure white / Elevated dark card |
| **Card Foreground** | `--card-foreground` | `oklch(0.145 0.015 255)` | `oklch(0.93 0.01 265)` | Slate text on card surface |
| **Popover** | `--popover` | `oklch(1 0 0)` | `oklch(0.16 0.018 265)` | Floating panel surface |
| **Popover Foreground** | `--popover-foreground`| `oklch(0.145 0.015 255)` | `oklch(0.93 0.01 265)` | Text on dropdowns & dialogs |
| **Primary** | `--primary` | `oklch(0.58 0.165 157)` | `oklch(0.68 0.16 157)` | Calibrated Emerald (`#32bd87` emblem match) |
| **Primary Foreground** | `--primary-foreground`| `oklch(0.99 0.005 157)` | `oklch(0.12 0.015 265)` | High-contrast text on primary |
| **Secondary** | `--secondary` | `oklch(0.95 0.008 255)` | `oklch(0.2 0.02 265)` | Soft slate subtle fill |
| **Secondary Foreground**| `--secondary-foreground`| `oklch(0.35 0.02 255)` | `oklch(0.85 0.012 265)` | Medium-contrast text |
| **Muted** | `--muted` | `oklch(0.96 0.004 250)` | `oklch(0.2 0.018 265)` | Muted container / tab background |
| **Muted Foreground** | `--muted-foreground` | `oklch(0.52 0.015 255)` | `oklch(0.58 0.015 265)` | Secondary / subtitle / placeholder text |
| **Accent** | `--accent` | `oklch(0.96 0.02 250)` | `oklch(0.25 0.05 157)` | Hover fill highlight |
| **Accent Foreground** | `--accent-foreground` | `var(--primary)` | `oklch(0.85 0.1 157)` | Hover text highlight |
| **Destructive** | `--destructive` | `oklch(0.58 0.22 25)` | `oklch(0.65 0.22 25)` | Crimson Red / Danger |
| **Border** | `--border` | `oklch(0.91 0.008 255)` | `oklch(0.24 0.018 265)` | Subtle divider line |
| **Input Border** | `--input` | `oklch(0.91 0.008 255)` | `oklch(0.24 0.018 265)` | Field default border |
| **Ring (Focus)** | `--ring` | `oklch(0.42 0.18 270)` | `oklch(0.68 0.16 157)` | Focus outline ring |

---

### 1.2 Sidebar Specific Tokens

| Token Name | Variable | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Sidebar Background** | `--sidebar` | `oklch(1 0 0)` | `oklch(0.1 0.018 265)` | Navigation rail background |
| **Sidebar Text** | `--sidebar-foreground` | `oklch(0.45 0.015 255)` | `oklch(0.8 0.012 265)` | Inactive nav links |
| **Sidebar Border** | `--sidebar-border` | `oklch(0.93 0.005 255)` | `oklch(0.18 0.02 265)` | Right border divider |
| **Sidebar Accent** | `--sidebar-accent` | `oklch(0.97 0.015 250)` | `oklch(0.18 0.025 265)` | Active item container background |
| **Sidebar Accent Text** | `--sidebar-accent-foreground` | `var(--sidebar-primary)` | `oklch(0.9 0.01 265)` | Active nav text |
| **Sidebar Primary** | `--sidebar-primary` | `var(--primary)` | `oklch(0.68 0.16 157)` | Active indicator & badges |
| **Sidebar Primary Text**| `--sidebar-primary-foreground`| `oklch(1 0 0)` | `oklch(0.12 0.015 265)`| Contrasting text |

---

### 1.3 Semantic Feedback & Status Tokens

| Semantic Role | Token Variable | Light Token Value | Dark Token Value | CSS Utility Badge |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `--success` | `oklch(0.58 0.165 157)` | `oklch(0.65 0.16 157)` | `.badge-success` / `bg-emerald-500/10` |
| **Success Text** | `--success-foreground` | `oklch(0.98 0.005 157)` | `oklch(0.12 0.015 157)` | `text-emerald-600 dark:text-emerald-400` |
| **Warning** | `--warning` | `oklch(0.72 0.18 65)` | `oklch(0.76 0.18 65)` | `.badge-warning` / `bg-amber-500/10` |
| **Warning Text** | `--warning-foreground` | `oklch(0.25 0.05 65)` | `oklch(0.12 0.015 65)` | `text-amber-600 dark:text-amber-400` |
| **Info** | `--info` | `oklch(0.55 0.18 220)` | `oklch(0.62 0.18 220)` | `.badge-info` / `bg-blue-500/10` |
| **Info Text** | `--info-foreground` | `oklch(0.98 0.005 220)` | `oklch(0.12 0.015 220)` | `text-blue-600 dark:text-blue-400` |
| **Destructive/Danger** | `--destructive` | `oklch(0.58 0.22 25)` | `oklch(0.65 0.22 25)` | `.badge-danger` / `bg-rose-500/10` |

---

### 1.4 Dynamic Accent Themes (`[data-accent="..."]`)

Defined in [`web/app/globals.css:264-414`](file:///d:/Projects/project/clixprocrm/web/app/globals.css#L264-L414):
- **Emerald (Default):** `oklch(0.58 0.165 157)` (Light) / `oklch(0.68 0.16 157)` (Dark)
- **Blue:** `oklch(0.55 0.19 250)` (Light) / `oklch(0.68 0.16 250)` (Dark)
- **Violet:** `oklch(0.54 0.22 295)` (Light) / `oklch(0.68 0.18 295)` (Dark)
- **Amber:** `oklch(0.62 0.17 75)` (Light) / `oklch(0.75 0.16 75)` (Dark)
- **Rose:** `oklch(0.56 0.21 15)` (Light) / `oklch(0.70 0.18 15)` (Dark)
- **Indigo:** `oklch(0.55 0.22 265)` (Light) / `oklch(0.68 0.18 265)` (Dark)
- **Purple:** `oklch(0.56 0.24 315)` (Light) / `oklch(0.68 0.20 315)` (Dark)
- **Red:** `oklch(0.57 0.22 27)` (Light) / `oklch(0.68 0.20 27)` (Dark)
- **Teal:** `oklch(0.58 0.15 180)` (Light) / `oklch(0.68 0.15 180)` (Dark)
- **Cyan:** `oklch(0.60 0.16 210)` (Light) / `oklch(0.70 0.16 210)` (Dark)

---

## 2. Typography System

### 2.1 Font Families

| Role | Token Variable | Fallback Stack | Active Font Overrides |
| :--- | :--- | :--- | :--- |
| **Sans / Body** | `--font-sans` | `"Segoe UI", "Helvetica Neue", "Arial Nova", sans-serif` | Configured via `[data-font="..."]` classes (Inter, Roboto, Poppins, Jakarta, Outfit, Space, Lora, Fira, Geist) |
| **Display / Headings** | `--font-display` | `"Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif` | Overridden dynamically to match selected brand font |
| **Monospace / Numbers** | `--font-mono` | `"Cascadia Mono", "SFMono-Regular", "Consolas", monospace` | Used in financial figures, table IDs, and timestamps |

### 2.2 Heading & Text Hierarchy

| Typography Style | CSS Classes | Font Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `text-2xl sm:text-3xl font-extrabold` | 24px–30px | 800 | 1.15 | KPI Metric Hero Values, Auth Title |
| **CRM Page Title** | `.crm-page-title` (`text-xl font-bold sm:text-2xl`) | 20px–24px | 700 | 1.2 | Header on all main module pages |
| **Section Heading** | `.crm-section-title` (`text-base font-semibold sm:text-lg`) | 16px–18px | 600 | 1.3 | Card headers, Drawer section titles |
| **Card Title** | `text-base font-bold tracking-tight` | 16px | 700 | 1.25 | Grid cards, modal dialog titles |
| **Body Default** | `text-sm font-normal text-foreground` | 14px | 400 | 1.5 | Primary UI text, table data cells |
| **Body Medium** | `text-sm font-medium text-foreground` | 14px | 500 | 1.5 | Interactive items, form inputs, buttons |
| **Body Subtitle** | `.crm-description` (`text-xs sm:text-sm font-normal`) | 12px–14px | 400 | 1.6 | Subtitles beneath page headers |
| **Table Header** | `.crm-table-th` (`text-[12px] font-semibold tracking-[0.05em] uppercase`) | 12px | 600 | 1.2 | Data table column headers |
| **Caption / Badge** | `text-[10px] font-bold uppercase tracking-wider` | 10px | 700 | 1.0 | Status badges, category pills, role tags |
| **Table Cell** | `.crm-table-td` (`text-sm align-middle`) | 14px | 400 | 1.5 | Data table data rows |

---

## 3. Radius Scale

Defined in [`web/app/globals.css:62-72, 115-120`](file:///d:/Projects/project/clixprocrm/web/app/globals.css#L62-L72) and [`web/shared/lib/design-system.ts`](file:///d:/Projects/project/clixprocrm/web/shared/lib/design-system.ts):

| Token Variable | Radius Value | Tailwind Equiv. | Canonical Target Element |
| :--- | :--- | :--- | :--- |
| `--radius-xs` | `6px` | `rounded-sm` / `rounded-md` | Micro tags, nested indicators |
| `--radius-sm` | `8px` | `rounded-lg` / `rounded-md` | Badges, Tooltips, Action dropdown items |
| `--radius-md` / `--crm-radius-control` | `10px` | `rounded-lg` / `rounded-md` | Buttons, Inputs, Select triggers, Alert banners |
| `--radius-lg` / `--crm-radius-card` | `12px` | `rounded-xl` | CRM Cards, Search bars, Table containers, Sidebar widgets |
| `--radius-xl` / `--crm-radius-modal` | `14px` (capped) | `rounded-2xl` / `rounded-xl` | Modals, Dialogs, Contextual settings drawer |
| `--radius-2xl` / `--radius-3xl` | `14px` (capped) | `rounded-2xl` | Large surface overlays |
| `--radius-full` / `--crm-radius-pill` | `9999px` | `rounded-full` | Avatars, indicator status dots, timeframe pills |

---

## 4. Spacing Scale & Layout Dimensions

### 4.1 Shell Insets & Layout Tokens

```css
--crm-shell-inset: 0.75rem;          /* 12px Viewport boundary margin */
--crm-shell-bottom-space: 0.75rem;   /* 12px Bottom breathing space */
--crm-layout-gap: 0.75rem;           /* 12px Spacing between adjacent shells */
--crm-layout-bottom-space: 0.75rem;  /* 12px Spacing at bottom of page container */
--crm-card-padding: 1.25rem;         /* 20px Standard internal card padding */
--crm-section-gap: 1.25rem;          /* 20px Standard gap between stacked sections */
--crm-page-gap: 1.5rem;              /* 24px Gap between header, metrics, & workspace */
```

### 4.2 Control Sizing

| Control Type | Token / Class | Height | Padding |
| :--- | :--- | :--- | :--- |
| **Standard Button** | `Button size="default"` | `h-10` (40px / 2.5rem) | `px-4` |
| **Small Button** | `Button size="sm"` | `h-9` (36px / 2.25rem) | `px-3` |
| **Large Button** | `Button size="lg"` | `h-11` (44px / 2.75rem) | `px-5` |
| **Extra Small Button** | `Button size="xs"` | `h-8` (32px / 2.0rem) | `px-3` |
| **Standard Input** | `Input` (`.crm-control`) | `h-10` (40px) | `px-4 py-2` |
| **Select Trigger** | `SelectTrigger` | `h-10` (40px) or `h-9` (36px) | `px-4 py-2` |
| **Icon Box Container** | `.crm-icon-box` | `size-9` (36px) or `size-10` (40px) | Centered |
| **Table Head Row** | `.crm-table-th` | `h-10 sm:h-11` (40px–44px) | `px-4 sm:px-6` |
| **Table Body Row** | `.crm-table-td` / `row` | `h-16` (64px) | `px-4 sm:px-6 py-3` |
| **Topbar Header** | `<Topbar />` inner container | `h-[58px]` | `px-3.5 sm:px-5` |
| **Sidebar Width** | `<Sidebar />` | `270px` (Expanded) / `86px` (Collapsed) | `p-3` |

---

## 5. Shadow System

Defined in [`web/app/globals.css:163-179, 256-261`](file:///d:/Projects/project/clixprocrm/web/app/globals.css#L163-L179):

| Token Name | Light Mode Value | Dark Mode Value | Intended Usage |
| :--- | :--- | :--- | :--- |
| `--shadow-xs` | `0 1px 2px oklch(0 0 0 / 0.04)` | Inherited | Icon boxes, micro badges |
| `--shadow-sm` | `0 1px 3px oklch(0 0 0 / 0.05), 0 1px 2px -1px oklch(0 0 0 / 0.04)` | Inherited | Input fields, small buttons |
| `--shadow-md` | `0 4px 6px -1px oklch(0 0 0 / 0.08), 0 2px 4px -2px oklch(0 0 0 / 0.05)` | Inherited | Dropdown menus, popovers |
| `--shadow-lg` | `0 10px 15px -3px oklch(0 0 0 / 0.08), 0 4px 6px -4px oklch(0 0 0 / 0.04)` | Inherited | Floating action cards |
| `--shadow-xl` | `0 20px 25px -5px oklch(0 0 0 / 0.08), 0 8px 10px -6px oklch(0 0 0 / 0.04)` | Inherited | Modals, large dialogs |
| `--shadow-card` / `--crm-card-shadow` | `0 1px 3px 0 oklch(0 0 0 / 0.04), 0 1px 2px -1px oklch(0 0 0 / 0.03)` | `0 1px 3px 0 oklch(0 0 0 / 0.35), 0 1px 2px -1px oklch(0 0 0 / 0.25)` | Base CRM card resting state |
| `--shadow-card-hover` / `--crm-card-hover-shadow` | `0 4px 12px -2px oklch(0 0 0 / 0.06), 0 2px 4px -2px oklch(0 0 0 / 0.03)` | `0 4px 16px -2px oklch(0 0 0 / 0.50), 0 2px 6px -2px oklch(0 0 0 / 0.35)` | Hover state on interactive cards |
| `--shadow-sidebar` | `1px 0 0 oklch(0.93 0.005 255)` | Inherited | Sidebar right boundary |
| `--shadow-premium` | `0 0 0 1px oklch(0.91 0.008 255), 0 10px 30px -10px oklch(0 0 0 / 0.08)` | `0 0 0 1px oklch(0.24 0.018 265), 0 10px 30px -10px oklch(0 0 0 / 0.4)` | Premium floating modals |
| `--shadow-glow` | `0 0 20px oklch(0.58 0.165 157 / 0.12)` | Inherited | Accent glowing badges / active states |

---

## 6. Motion & Animation Tokens

Defined in [`web/shared/lib/motion.ts`](file:///d:/Projects/project/clixprocrm/web/shared/lib/motion.ts) and [`web/shared/styles/button-icons.css`](file:///d:/Projects/project/clixprocrm/web/shared/styles/button-icons.css):

### 6.1 Durations & Easings

```typescript
export const motionTokens = {
  duration: {
    micro: 0.1,      // 100ms: Press, instant feedback, button tap
    fast: 0.15,      // 150ms: Dropdowns, tooltips, buttons
    normal: 0.2,     // 200ms: Modals, tabs, popovers
    panel: 0.25,     // 250ms: Drawers, side sheets
    page: 0.2,       // 200ms: Route/page entrance
  },
  easing: {
    easeOut: [0.16, 1, 0.3, 1],   // Smooth decelerating cubic bezier
    easeInOut: [0.4, 0, 0.2, 1],  // Standard symmetrical transition
    snappy: [0.2, 0, 0, 1],       // Snappy entrance
  },
  scale: {
    buttonHover: 1.01,
    buttonTap: 0.98,
    iconHover: 1.05,
    iconTap: 0.94,
    cardHover: 1.002,
    subtleHover: 1.005,
    subtleTap: 0.985,
  },
};
```

### 6.2 Animation Variants in Motion System
- `dropdownVariants`: Opacity 0 -> 1, y: -4px -> 0, scale: 0.99 -> 1 (150ms)
- `modalVariants`: Opacity 0 -> 1, scale: 0.98 -> 1 (200ms)
- `drawerRightVariants`: x: "100%" -> 0, opacity: 0.8 -> 1 (250ms)
- `drawerLeftVariants`: x: "-100%" -> 0, opacity: 0.8 -> 1 (250ms)
- `tabContentVariants`: Opacity 0 -> 1, y: 4px -> 0 (150ms)
- `shakeErrorVariants`: x: `[-3, 3, -2, 2, 0]` (250ms easeInOut)
- `successPopVariants`: Scale: 0.9 -> 1, opacity: 0 -> 1 (150ms)
