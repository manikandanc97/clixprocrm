# CRM Design System Extraction & UI Consistency Audit — Executive Summary

> **Audit Completion Date:** September 2026  
> **Repository:** `clixprocrm`  
> **Audit Mode:** Strict Read-Only Extraction & Deep Codebase Inspection  
> **Generated Documentation Suite:** [`docs/design-audit/`](file:///d:/Projects/project/clixprocrm/docs/design-audit/)

---

## 1. Current Design System Overview

The ClixPro CRM frontend is a modern **Next.js 16 (App Router)** and **React 19** application styled with **Tailwind CSS v4** utilizing an **OKLCH-based color system** and a custom enterprise theme ("Orbit Premium Design System"). 

The visual design language is characterized by:
- A signature **Emerald primary brand color** (`oklch(0.58 0.165 157)` calibrated to `#32bd87`).
- **3D layered pastel gradient metric cards** with halftone dot-matrix textures and cubic bezier sparkline curves.
- A **Two-Stage Scroll Architecture** for table-heavy modules (Contacts, Deals, Companies, Invoices, Quotations, Tasks, Employees) that scrolls KPI cards away before docking a sticky workspace directly under the floating topbar.
- **Micro-interactions and GPU-accelerated motion** powered by **Framer Motion 12** and `@animateicons/react`.

---

## 2. Current Styling Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ globals.css (@import "tailwindcss"; @import "tw-animate-css";)              │
│ ├─ @theme inline (Typography, Color mappings, Sidebar tokens, Radius scale) │
│ ├─ :root (Light mode OKLCH tokens, CRM tokens, Shadow tokens)               │
│ ├─ .dark (Dark mode OKLCH tokens, Elevated dark surfaces)                   │
│ ├─ [data-accent="..."] (10 Tenant accent overrides)                         │
│ ├─ [data-font="..."] (9 Brand font family overrides)                        │
│ ├─ @layer base (Universal thin scrollbars, Reduced motion)                  │
│ ├─ @layer utilities (.crm-card, .crm-control, .crm-table-workspace-sticky)  │
│ └─ Auth Layout Specific Utilities (.auth-bg-layer, .auth-card)              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Shared Logic: motion.ts (durations, easings, variants) & design-system.ts   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Component Layers: @/shared/ui (Primitives) -> @/shared/components/crm       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Token Summary

| Dimension | Canonical Current Values |
| :--- | :--- |
| **Primary Color** | Light: `oklch(0.58 0.165 157)` / Dark: `oklch(0.68 0.16 157)` |
| **Background / Surface** | Background: `oklch(0.985 0.002 247)` / Card: `oklch(1 0 0)` / Popover: `oklch(1 0 0)` |
| **Borders** | Default: `oklch(0.91 0.008 255)` / Dark: `oklch(0.24 0.018 265)` |
| **Typography Stack** | Sans: `"Segoe UI", "Helvetica Neue", "Arial Nova", sans-serif`<br>Display: `"Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif`<br>Mono: `"Cascadia Mono", monospace` |
| **Radius Scale** | Sm: `8px`, Control/Button/Input: `10px` (`--radius-md`), Card/Container: `12px` (`--radius-lg`), Modal/Dialog: `14px` (`--radius-xl`), Pill: `9999px` |
| **Control Heights** | Default button/input: `40px` (`h-10`), Small: `36px` (`h-9`), Extra-small: `32px` (`h-8`), Large: `44px` (`h-11`) |
| **Table Geometry** | Table header: `40px–44px` (`h-10 sm:h-11`), Table body rows: `64px` (`h-16`) |
| **Motion Durations** | Micro: `100ms`, Fast: `150ms`, Normal: `200ms`, Panel: `250ms`, Page: `200ms` |
| **Motion Easings** | `easeOut: [0.16, 1, 0.3, 1]`, `easeInOut: [0.4, 0, 0.2, 1]`, `snappy: [0.2, 0, 0, 1]` |

---

## 4. Component Summary

- **UI Primitives (`@/shared/ui`):** 27 standard primitives (`button`, `input`, `textarea`, `select`, `badge`, `card`, `dialog`, `sheet`, `dropdown-menu`, `table`, `tabs`, `tooltip`, `checkbox`, `switch`, `avatar`, `alert-dialog`, `skeleton`, `sonner`, `calendar`, `popover`, `progress`, `slider`, `separator`, `scroll-area`, `label`, `form`, `logo`).
- **CRM Core Components (`@/shared/components/crm`):** 23 shared CRM components (`CRMPageContainer`, `CRMPageHeader`, `CRMToolbar`, `CRMDataTable`, `CRMCard`, `CRMMetricCard`, `CRMMetricsGrid`, `CRMPagination`, `ContextualSettingsDrawer`, `CRMRoleBadge`, `CRMStatusBadge`, `ViewToggle`, etc.).
- **Feature Modules (`@/features/*`):** 18 feature domains (`contacts`, `deals`, `companies`, `invoices`, `quotations`, `tasks`, `employees`, `dashboard`, `reports`, `settings`, `pipeline`, `ai`, `auth`, `calendar`, `forms`, `help-center`).

---

## 5. Major Inconsistencies Discovered

1. **Status Badge Disparity:** 3 competing badge implementations (`StatusBadge.tsx` vs `CRMStatusBadge.tsx` vs custom inline `<span>` in `invoices/page.tsx`).
2. **Table Implementation Disparity:** Invoices module constructs a manual raw `<table>` with `text-xs py-3 px-4`, deviating from standard 64px `CRMDataTable` row height.
3. **Corner Radius Divergence:** Cards use `rounded-xl` (12px), while `CRMMetricCard` and `CRMPagination` use `rounded-2xl` (16px).
4. **Non-Standard Button Heights:** Drawer action bars use arbitrary one-off `h-8.5` (34px) instead of standard `h-8` or `h-9`.
5. **Employees Sticky Grid Override:** Employees page applies `!grid grid-cols-1 lg:grid-cols-4` directly onto `.crm-table-workspace-sticky`, altering the viewport bounding container.
6. **Metric Card Color Taxonomy:** Reports page passes non-standard color keys (`"rose"`, `"amber"`) instead of `MetricColor` keys (`"pink"`, `"orange"`).

---

## 6. Duplicate Component Groups

- **EmptyState:** `EmptyState.tsx` (Canonical, 12 presets) vs `crm/EmptyState.tsx` (Legacy re-export) vs `LeadEmptyState.tsx` (Local) vs `calendar/EmptyState.tsx` (Local).
- **Tables:** `CRMDataTable.tsx` (Compound) vs `DataTable.tsx` (Generic) vs `table.tsx` (Primitive).
- **Status Badges:** `StatusBadge.tsx` (Dot/Pulse) vs `CRMStatusBadge.tsx` (Tone classes).
- **Search Bars:** `CRMSearchBar.tsx` (Orphaned component) vs `CRMToolbar.tsx` (Integrated search).

---

## 7. Hardcoded Style Problems

- **App Shell Canvas Colors:** Hardcoded background undertones (`#fafafa` light, `#050505` dark) in `DashboardShell` and `SuperAdminLayout`.
- **Metric Card Palette:** 30+ inline hex values in `CRMMetricCard.tsx` (`#D8F5E5`, `#00A76F`, `#3B1475`, etc.) that are candidates for design tokens.
- **Fixed Layout Dimensions:** Hardcoded `270px` / `86px` sidebar widths, `58px` topbar height, `350px` chart heights.

---

## 8. Most-Used Canonical Patterns

1. **Header Pattern:** `<CRMPageHeader />` with `.crm-icon-box` + `.crm-page-title` + right-aligned action buttons.
2. **Two-Stage Scroll Workspace:** `.crm-table-workspace-sticky` docking below topbar with inner `.crm-table-wrap` handling scroll.
3. **Integrated Toolbar:** `<CRMToolbar />` combining instant-clear search input + filter pills + segmented view switcher.
4. **Contextual Settings:** `<ContextualSettingsDrawer />` providing slide-over configuration with unsaved-change protection.
5. **Module Empty States:** `<EmptyState module="..." />` with ambient glow and dual CTA buttons.

---

## 9. Recommended Reference Screens (Golden Screens)

- 🥇 **Contacts (`/contacts`):** Top reference for data table CRUD, URL filter sync, metric cards, and contextual settings.
- 🥈 **Deals & Pipeline (`/deals`):** Top reference for multi-view controllers (Table, Grid, and Kanban Pipeline).
- 🥉 **CRM Dashboard (`/dashboard`):** Top reference for composite layouts, timeframe switching, and empty onboarding hubs.

---

## 10. Top 5 Highest-Priority Cleanup Areas for Phase 2

1. **Unify Status Badge System:** Consolidate `<CRMStatusBadge>`, `<StatusBadge>`, and inline invoice spans into a single canonical badge component with standard typography (`text-[10px] font-bold uppercase tracking-wider`).
2. **Standardize Invoices Table Layout:** Refactor the raw `<table>` in `invoices/page.tsx` to consume `<CRMDataTable>` / `crmTableStyles` with standard 64px row heights and 44px sticky headers.
3. **Normalize Employees Sticky Workspace:** Isolate the sticky table container from the 4-column operational grid on `employees/page.tsx` so viewport scroll boundaries remain consistent.
4. **Eliminate Duplicate EmptyState Components:** Remove orphaned `LeadEmptyState` and `calendar/EmptyState` in favor of `@/shared/components/EmptyState`.
5. **Tokenize Metric Card Color Scales:** Move inline pastel hex palettes from `CRMMetricCard.tsx` into centralized CSS variables or theme tokens.
