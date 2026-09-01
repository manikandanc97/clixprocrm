# ClixProCRM Canonical Design System Specification

> **Status:** Active Standard  
> **Version:** 2.0 (Standardized)  
> **Applicability:** Entire `clixprocrm` frontend (`/web`)  
> **Scope:** Canonical single source of truth for UI components, design tokens, layout patterns, motion, and styling.

---

## 1. Purpose

This document defines the **Canonical Design System** for ClixProCRM. It standardizes the established, dominant visual and architectural patterns discovered across the codebase. 

All future feature implementation, bug fixing, refactoring, and AI agent pair programming must adhere strictly to the specifications defined in this document to prevent UI fragmentation, duplicated components, and arbitrary styling overrides.

---

## 2. Design Principles

1. **Restrained Enterprise SaaS Aesthetic:** Professional, clean, and high-density with calm contrast, purposeful micro-interactions, and refined typography.
2. **Deterministic Token Hierarchy:** Always consume semantic tokens (`--primary`, `--card`, `--border`, `--radius-lg`) rather than hardcoded hex codes, arbitrary pixels, or ad-hoc Tailwind classes.
3. **Preserve Specialized Scroll Architecture:** The CRM’s signature **Two-Stage Scroll System** must be preserved across all primary list and CRUD modules to optimize vertical screen real estate.
4. **Single Source of Truth for Components:** Every UI element category has one designated **Canonical Component**. Legacy wrappers and duplicate components are slated for migration and must not be used for new work.
5. **GPU-Accelerated Micro-Interactions:** Smooth hover and press feedback utilizing Framer Motion tokens (`motionTokens`) and `@animateicons/react` without distracting spring overshoots.

---

## 3. Design Tokens Specification

### 3.1 Color Tokens (`globals.css`)

| Token Variable | Canonical Light Mode | Canonical Dark Mode | Semantic Role | Status |
| :--- | :--- | :--- | :--- | :--- |
| `--primary` | `oklch(0.58 0.165 157)` | `oklch(0.68 0.16 157)` | Signature Emerald Brand (`#32bd87` match) | **Canonical** |
| `--primary-foreground` | `oklch(0.99 0.005 157)` | `oklch(0.12 0.015 265)` | Contrasting text on primary buttons/badges | **Canonical** |
| `--background` | `oklch(0.985 0.002 247)` | `oklch(0.12 0.015 265)` | Main viewport background | **Canonical** |
| `--foreground` | `oklch(0.145 0.015 255)` | `oklch(0.93 0.01 265)` | Primary body & heading text | **Canonical** |
| `--card` | `oklch(1 0 0)` | `oklch(0.16 0.018 265)` | Card & surface container fill | **Canonical** |
| `--card-foreground` | `oklch(0.145 0.015 255)` | `oklch(0.93 0.01 265)` | Text on card surfaces | **Canonical** |
| `--popover` | `oklch(1 0 0)` | `oklch(0.16 0.018 265)` | Floating dropdowns, sheets, and dialogs | **Canonical** |
| `--popover-foreground` | `oklch(0.145 0.015 255)` | `oklch(0.93 0.01 265)` | Text on floating panels | **Canonical** |
| `--secondary` | `oklch(0.95 0.008 255)` | `oklch(0.2 0.02 265)` | Secondary buttons, active filter pill fill | **Canonical** |
| `--secondary-foreground` | `oklch(0.35 0.02 255)` | `oklch(0.85 0.012 265)` | Text on secondary elements | **Canonical** |
| `--muted` | `oklch(0.96 0.004 250)` | `oklch(0.2 0.018 265)` | Inactive tab background, input backgrounds | **Canonical** |
| `--muted-foreground` | `oklch(0.52 0.015 255)` | `oklch(0.58 0.015 265)` | Subtitles, table headers, placeholders | **Canonical** |
| `--accent` | `oklch(0.96 0.02 250)` | `oklch(0.25 0.05 157)` | Hover highlights and selection states | **Canonical** |
| `--accent-foreground` | `var(--primary)` | `oklch(0.85 0.1 157)` | Highlighted hover text | **Canonical** |
| `--destructive` | `oklch(0.58 0.22 25)` | `oklch(0.65 0.22 25)` | Danger alerts, delete actions, errors | **Canonical** |
| `--border` | `oklch(0.91 0.008 255)` | `oklch(0.24 0.018 265)` | Default component borders & table dividers | **Canonical** |
| `--input` | `oklch(0.91 0.008 255)` | `oklch(0.24 0.018 265)` | Form input resting border | **Canonical** |
| `--ring` | `oklch(0.42 0.18 270)` | `oklch(0.68 0.16 157)` | Focus outline ring | **Canonical** |
| `--success` | `oklch(0.58 0.165 157)` | `oklch(0.65 0.16 157)` | Positive status badges & alerts | **Canonical** |
| `--warning` | `oklch(0.72 0.18 65)` | `oklch(0.76 0.18 65)` | Caution status badges & alerts | **Canonical** |
| `--info` | `oklch(0.55 0.18 220)` | `oklch(0.62 0.18 220)` | Information status badges & alerts | **Canonical** |

---

### 3.2 Typography Tokens

| Style Role | Font Family | Size (Desktop / Mobile) | Weight | Line Height | Tracking | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title / KPI Value** | `var(--font-sans)` | `30px` (sm:3xl) / `24px` (2xl) | `800` (extrabold) | `1.15` | `-0.03em` | **Canonical** |
| **Page Title** (`.crm-page-title`) | `var(--font-display)` | `24px` (sm:2xl) / `20px` (xl) | `700` (bold) | `1.2` | `-0.02em` | **Canonical** |
| **Section Title** (`.crm-section-title`) | `var(--font-display)` | `18px` (sm:lg) / `16px` (base) | `600` (semibold) | `1.3` | `-0.01em` | **Canonical** |
| **Card Title** | `var(--font-sans)` | `16px` (`text-base`) | `700` (bold) | `1.25` | `normal` | **Canonical** |
| **Body Primary** | `var(--font-sans)` | `14px` (`text-sm`) | `400` (normal) | `1.5` | `normal` | **Canonical** |
| **Body Medium / Action** | `var(--font-sans)` | `14px` (`text-sm`) | `500` / `600` | `1.5` | `normal` | **Canonical** |
| **Subtitle / Description** | `var(--font-sans)` | `14px` (sm:sm) / `12px` (xs) | `400` (normal) | `1.6` | `normal` | **Canonical** |
| **Table Head Column** | `var(--font-sans)` | `12px` (`text-[12px]`) | `600` (semibold) | `1.2` | `0.05em` (uppercase) | **Canonical** |
| **Badge / Status Tag** | `var(--font-sans)` | `10px` (`text-[10px]`) | `700` (bold) | `1.0` | `0.08em` (uppercase) | **Canonical** |
| **Monospace / Financial** | `var(--font-mono)` | `14px` (`text-sm`) / `12px` | `600` / `700` | `1.2` | `tabular-nums` | **Canonical** |

---

### 3.3 Radius Tokens

| Radius Token | CSS Value | Canonical Target Components | Status |
| :--- | :--- | :--- | :--- |
| `--radius-xs` | `6px` | Inline micro tags, nested chips | **Canonical** |
| `--radius-sm` | `8px` | Badges, Tooltips, Action dropdown items | **Canonical** |
| `--radius-md` / `--crm-radius-control` | `10px` | Buttons, Inputs, Dropdown triggers, Selects, Alerts | **Canonical** |
| `--radius-lg` / `--crm-radius-card` | `12px` | CRM Cards, Search Bars, Table Wrappers, Widgets | **Canonical** |
| `--radius-xl` / `--crm-radius-modal` | `14px` | Modals, Dialogs, Contextual Settings Drawers | **Canonical** |
| `--radius-full` / `--crm-radius-pill` | `9999px` | Avatars, indicator status dots, timeframe switcher pills | **Canonical** |
| `rounded-2xl` (16px) | `16px` | Metric cards & pagination (to be normalized to 14px) | **Legacy / Deviant** |

---

### 3.4 Spacing & Sizing Tokens

```css
/* Canonical CRM Shell & Viewport Insets */
--crm-shell-inset: 0.75rem;          /* 12px outer viewport margin */
--crm-shell-bottom-space: 0.75rem;   /* 12px viewport bottom breathing space */
--crm-layout-gap: 0.75rem;           /* 12px gap between adjacent structural containers */
--crm-layout-bottom-space: 0.75rem;  /* 12px bottom space for scrollable page */
--crm-card-padding: 1.25rem;         /* 20px standard card inner padding */
--crm-section-gap: 1.25rem;          /* 20px gap between stacked page sections */
--crm-page-gap: 1.5rem;              /* 24px gap between header, metric cards, and workspace */

/* Canonical Control Dimensions */
--crm-control-height: 2.5rem;        /* 40px (h-10) Default Button & Input height */
--crm-control-height-sm: 2.25rem;     /* 36px (h-9)  Small Button height */
--crm-control-height-lg: 2.75rem;     /* 44px (h-11) Large Button height */
--crm-control-height-xs: 2.0rem;      /* 32px (h-8)  Extra Small Button height */
--crm-icon-box: 2.25rem;             /* 36px (size-9) Standard header icon container */
```

---

### 3.5 Shadow Tokens

| Token Variable | Light Mode Definition | Dark Mode Definition | Canonical Target | Status |
| :--- | :--- | :--- | :--- | :--- |
| `--shadow-card` | `0 1px 3px 0 oklch(0 0 0 / 0.04), 0 1px 2px -1px oklch(0 0 0 / 0.03)` | `0 1px 3px 0 oklch(0 0 0 / 0.35), 0 1px 2px -1px oklch(0 0 0 / 0.25)` | Resting CRM Cards, Table Wrappers, Toolbars | **Canonical** |
| `--shadow-card-hover` | `0 4px 12px -2px oklch(0 0 0 / 0.06), 0 2px 4px -2px oklch(0 0 0 / 0.03)` | `0 4px 16px -2px oklch(0 0 0 / 0.50), 0 2px 6px -2px oklch(0 0 0 / 0.35)` | Interactive Card Hover | **Canonical** |
| `--shadow-elevated` | `0 10px 30px -10px oklch(0 0 0 / 0.08)` | `0 10px 30px -10px oklch(0 0 0 / 0.4)` | Modals, Dialogs, Floating Sheets | **Canonical** |
| `--shadow-sidebar` | `1px 0 0 oklch(0.93 0.005 255)` | `1px 0 0 oklch(0.18 0.02 265)` | Sidebar boundary line | **Canonical** |

---

## 4. Motion System Specification

All motion in ClixProCRM is centralized in [`web/shared/lib/motion.ts`](file:///d:/Projects/project/clixprocrm/web/shared/lib/motion.ts):

### 4.1 Canonical Durations & Easings
```typescript
export const motionTokens = {
  duration: {
    micro: 0.1,      // 100ms: Button tap, instant micro-press feedback
    fast: 0.15,      // 150ms: Dropdown menus, tooltips, tab indicator shifts
    normal: 0.2,     // 200ms: Modals, dialogs, popovers, page entrance
    panel: 0.25,     // 250ms: Contextual drawers, side sheets
  },
  easing: {
    easeOut: [0.16, 1, 0.3, 1],   // Smooth decelerating cubic bezier (Standard)
    easeInOut: [0.4, 0, 0.2, 1],  // Symmetric transition
    snappy: [0.2, 0, 0, 1],       // Snappy entrance
  },
  scale: {
    buttonHover: 1.01,
    buttonTap: 0.98,
    iconHover: 1.05,
    iconTap: 0.94,
  },
};
```

---

## 5. Canonical Component System

For every major component category, the single designated canonical implementation is documented below:

| Component Category | Canonical Component & Location | Base Primitive | Legacy / Inconsistent Alternatives |
| :--- | :--- | :--- | :--- |
| **Button** | `<Button />` in [`web/shared/ui/button.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/ui/button.tsx) | Radix Slot + CVA | Arbitrary `h-8.5` buttons in drawers |
| **Input** | `<Input />` in [`web/shared/ui/input.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/ui/input.tsx) | HTML Input | Custom styled input elements |
| **Select** | `<Select />` in [`web/shared/ui/select.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/ui/select.tsx) | Radix Select | Native HTML `<select>` elements |
| **Status Badge** | `<StatusBadge />` in [`web/shared/components/StatusBadge.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/StatusBadge.tsx) | `<Badge />` | `<CRMStatusBadge>` in `crm/`, inline `<span>` in `invoices/` |
| **Card (General)** | `<CRMCard />` in [`web/shared/components/crm/CRMCard.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMCard.tsx) | `<Card />` | Ad-hoc `div` containers |
| **Metric Card** | `<CRMMetricCard />` in [`web/shared/components/crm/CRMMetricCard.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMMetricCard.tsx) | Custom 3D Pastel | Legacy `<MetricCard />` wrapper |
| **Page Header** | `<CRMPageHeader />` in [`web/shared/components/crm/CRMPageHeader.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMPageHeader.tsx) | Custom Flex | Ad-hoc custom page headers |
| **Toolbar** | `<CRMToolbar />` in [`web/shared/components/crm/CRMToolbar.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMToolbar.tsx) | Custom Motion | Individual un-grouped inputs |
| **Table System** | `<CRMDataTable />` in [`web/shared/components/crm/CRMDataTable.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMDataTable.tsx) | `<Table />` | Raw `<table>` in `invoices/page.tsx` |
| **Pagination** | `<CRMPagination />` in [`web/shared/components/crm/CRMPagination.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMPagination.tsx) | Custom Card | Inline pagination buttons |
| **Empty State** | `<EmptyState />` in [`web/shared/components/EmptyState.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/EmptyState.tsx) | Custom Motion | `<LeadEmptyState>`, `crm/EmptyState.tsx`, `calendar/EmptyState` |
| **Modal / Dialog** | `<FormModal />` in [`web/shared/components/form-modal.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/form-modal.tsx) | `<Dialog />` | Custom local dialog wrappers |
| **Context Drawer**| `<ContextualSettingsDrawer />` in [`web/shared/components/crm/ContextualSettingsDrawer.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/ContextualSettingsDrawer.tsx) | `<Sheet />` | Legacy deep settings links |
| **Sidebar Rail** | `<BaseSidebar />` in [`web/shared/components/sidebar/BaseSidebar.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/sidebar/BaseSidebar.tsx) | Custom Nav | Legacy hardcoded navigation lists |

---

## 6. Canonical Table System

The CRM Table System is the most critical operational view in the platform.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ .crm-table-workspace-sticky (Sticky container, max-h: calc(100dvh - --sa-h)) │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ CRMToolbar (Instant Search, Filter Pills, View Switcher)                │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ .crm-table-wrap (rounded-xl border border-border bg-card shadow-card)   │ │
│ │   ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │   │ thead (sticky top-0 z-20 bg-card border-b border-border/60)     │   │ │
│ │   │   - Height: 44px (h-10 sm:h-11)                                 │   │ │
│ │   │   - Typography: text-[12px] uppercase font-semibold             │   │ │
│ │   │   - Padding: px-4 sm:px-6                                       │   │ │
│ │   ├─────────────────────────────────────────────────────────────────┤   │ │
│ │   │ tbody (divide-y divide-border/40, overflow-y: auto)             │   │ │
│ │   │   - Row Height: 64px (h-16)                                     │   │ │
│ │   │   - Hover State: hover:bg-muted/[0.03] transition-colors        │   │ │
│ │   │   - Cell Padding: px-4 sm:px-6 py-3                             │   │ │
│ │   │   - Typography: text-sm font-normal text-foreground             │   │ │
│ │   └─────────────────────────────────────────────────────────────────┘   │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ CRMPagination (Showing X–Y of Z items, rows per page, chevron buttons)  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Table Component Selection Rules:
1. **Use `<CRMDataTable />`** for all standard CRM entity lists (Contacts, Deals, Companies, Quotations, Invoices, Tasks, Employees) where custom cell components, interactive avatars, and entity actions are rendered.
2. **Use `<DataTable />`** when building strictly schema-driven generic administrative tables with automatic column sorting, skeleton rows, and built-in error states.
3. **Never build raw `<table>` markup directly in route pages.**

---

## 7. Canonical Card System

The CRM separates card surfaces into 5 distinct categories:

```
┌─────────────────────────┬───────────────────┬────────────────────────────────────────────────┬──────────────────────────┐
│ Card Category           │ Radius            │ Surface / Styling                              │ Padding                  │
├─────────────────────────┼───────────────────┼────────────────────────────────────────────────┼──────────────────────────┤
│ 1. Standard CRM Card    │ rounded-xl (12px) │ border border-border bg-card shadow-card       │ p-4 sm:p-5               │
│ 2. Metric KPI Card      │ rounded-2xl (14px)│ Pastel gradient + halftone dots + 3D icon pill │ p-4 sm:p-5               │
│ 3. Dashboard Widget     │ rounded-xl (12px) │ border border-border bg-card shadow-card       │ p-5 sm:p-6               │
│ 4. Modal / Dialog Card  │ rounded-xl (14px) │ bg-popover text-popover-foreground shadow-xl   │ p-6                      │
│ 5. Auth Surface Card    │ rounded-[22px]    │ bg-card border border-border/80 shadow-2xl     │ p-8 sm:p-10              │
└─────────────────────────┴───────────────────┴────────────────────────────────────────────────┴──────────────────────────┘
```

---

## 8. Canonical Page Blueprint

All standard CRM list and record modules must follow this architectural blueprint:

```tsx
export default function ModulePage() {
  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Standard Page Header */}
      <CRMPageHeader
        title="Module Title"
        subtitle="Descriptive explanation of module operations."
        icon={ModuleIcon}
        badge="Category Badge"
        actions={[
          { label: "Customize", icon: Settings, onClick: () => setIsDrawerOpen(true), variant: "outline" },
          { label: "New Entity", icon: Plus, onClick: () => setIsModalOpen(true), variant: "default" },
        ]}
      />

      {/* 2. Zero-State Fallback OR Operational Grid */}
      {entities.length === 0 ? (
        <EmptyState module="entities" action={{ label: "New Entity", onClick: handleCreate }} />
      ) : (
        <>
          {/* 3. KPI Metric Cards Grid */}
          <div className="shrink-0">
            <CRMMetricsGrid cols={3}>
              <CRMMetricCard title="Total" value={count} color="indigo" icon={ModuleIcon} />
              <CRMMetricCard title="Active" value={activeCount} color="emerald" icon={CheckIcon} />
              <CRMMetricCard title="Pending" value={pendingCount} color="orange" icon={ClockIcon} />
            </CRMMetricsGrid>
          </div>

          {/* 4. Two-Stage Sticky Workspace */}
          <div className="crm-table-workspace-sticky">
            <CRMToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              viewMode={viewMode}
              setViewMode={setViewMode}
              placeholder="Search records..."
            />

            <div className="flex-1 min-h-0 flex flex-col">
              <CRMDataTable>
                {/* Table Header & Rows */}
              </CRMDataTable>

              <CRMPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
              />
            </div>
          </div>
        </>
      )}

      {/* 5. In-Module Contextual Settings Drawer */}
      <ContextualSettingsDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title="Module Settings"
        sections={settingsSections}
      />
    </CRMPageContainer>
  );
}
```

---

## 9. Core Scroll Architecture Rules

1. **Two-Stage Scroll Enforcement:** Outer page scroll for header and KPI cards; inner container scroll (`.crm-table-wrap`) for table records.
2. **Dynamic Header Height Measurement:** `<Topbar />` measures its rendered height via `ResizeObserver` and exposes `--sa-header-h` for sticky bounds calculation (`calc(100dvh - var(--sa-header-h, 84px))`).
3. **`twoStageScroll={true}` Rule:** When building pages with sticky workspaces, always pass `twoStageScroll={true}` to `<CRMPageContainer>` to disable CSS transforms that break sticky positioning.
4. **Auto-Hiding Scrollbar Rule:** Use `.sidebar-scroll` for navigation rails and drawer panels to keep scrollbars invisible until active user interaction.

---

## 10. Migration Priorities

```
┌──────────┬──────────────────────────────────────────────────────────────────────────────────────────┐
│ Priority │ Migration Target                                                                         │
├──────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ P0       │ 1. Standardize Invoices raw <table> into canonical <CRMDataTable /> with 64px row height│
│          │ 2. Normalize Employees .crm-table-workspace-sticky to decouple from 4-column layout      │
│          │ 3. Unify StatusBadge system: retire CRMStatusBadge and inline invoice spans              │
├──────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ P1       │ 4. Retire orphaned LeadEmptyState and calendar/EmptyState in favor of central EmptyState │
│          │ 5. Tokenize inline pastel hex codes in CRMMetricCard.tsx                                 │
│          │ 6. Normalize non-standard h-8.5 button heights in ContextualSettingsDrawer to h-9/h-8   │
├──────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ P2       │ 7. Consolidate duplicate scrollbar utility classes in globals.css                         │
│          │ 8. Align metric card color taxonomy across Reports and Dashboard                         │
│          │ 9. Standardize table action icon size to size-4 (16px) across all modules                 │
├──────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ P3       │ 10. Remove orphaned CRMSearchBar.tsx component in favor of CRMToolbar integrated search  │
└──────────┴──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Golden Reference Screens

Developers and AI agents should use these existing screens as visual and architectural benchmarks:

1. 🥇 **[Contacts Screen (`/contacts`)](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/contacts/page.tsx):** Complete implementation of Two-Stage Scroll, KPI grid, toolbar filter pills, multi-view toggle, and contextual settings.
2. 🥈 **[Deals & Pipeline (`/deals`)](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/deals/page.tsx):** Benchmark for multi-view controller switching between Table, Grid, and Kanban Pipeline.
3. 🥉 **[CRM Dashboard (`/dashboard`)](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/dashboard/page.tsx):** Benchmark for executive summary cards, zero-state onboarding hub fallback, and timeframe controls.
