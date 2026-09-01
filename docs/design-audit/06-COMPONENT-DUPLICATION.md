# CRM Design System Audit — Component Duplication Analysis

> **Audit Date:** September 2026  
> **Repository:** `clixprocrm`  
> **Rule:** Objective analysis of duplicate and near-duplicate components performing identical or overlapping roles.

---

## 1. Summary of Duplicate Component Groups

```
┌───────────────────────────┬─────────────────────────────────────────────────────────────────┬────────────────────┐
│ Duplicate Group           │ Component Files Found                                           │ Duplication Type   │
├───────────────────────────┼─────────────────────────────────────────────────────────────────┼────────────────────┤
│ 1. Empty State System     │ - web/shared/components/EmptyState.tsx                          │ Wrapper / Legacy   │
│                           │ - web/shared/components/crm/EmptyState.tsx                      │ Feature Overlap    │
│                           │ - web/features/leads/components/LeadEmptyState.tsx              │                    │
│                           │ - web/features/calendar/components/EmptyState.tsx               │                    │
├───────────────────────────┼─────────────────────────────────────────────────────────────────┼────────────────────┤
│ 2. Table Systems          │ - web/shared/ui/table.tsx (Primitives)                          │ Parallel Pattern   │
│                           │ - web/shared/components/DataTable.tsx (Generic Column Table)    │                    │
│                           │ - web/shared/components/crm/CRMDataTable.tsx (Compound Table)   │                    │
├───────────────────────────┼─────────────────────────────────────────────────────────────────┼────────────────────┤
│ 3. Status Badge System    │ - web/shared/ui/badge.tsx (Base CVA Badge)                      │ Competing Variants │
│                           │ - web/shared/components/StatusBadge.tsx (Dot & Pulse Badge)     │                    │
│                           │ - web/shared/components/crm/CRMStatusBadge.tsx (Legacy Tone)    │                    │
│                           │ - web/shared/components/crm/CRMRoleBadge.tsx (Role Badges)      │                    │
│                           │ - web/shared/components/PlanBadge.tsx (Plan Tier Badges)        │                    │
├───────────────────────────┼─────────────────────────────────────────────────────────────────┼────────────────────┤
│ 4. Card Surfaces          │ - web/shared/ui/card.tsx (Primitive Card)                       │ Architectural Split│
│                           │ - web/shared/components/crm/CRMCard.tsx (Accent CRM Card)       │                    │
│                           │ - web/features/dashboard/components/DashboardWidgetWrapper.tsx  │                    │
├───────────────────────────┼─────────────────────────────────────────────────────────────────┼────────────────────┤
│ 5. Search Controls        │ - web/shared/components/crm/CRMSearchBar.tsx                    │ Redundant Orphan   │
│                           │ - web/shared/components/crm/CRMToolbar.tsx (Integrated Search)  │                    │
│                           │ - web/features/dashboard/components/GlobalSearch.tsx            │ (Distinct Modal)   │
└───────────────────────────┴─────────────────────────────────────────────────────────────────┴────────────────────┘
```

---

## 2. Deep Duplication Inspection

### Group 1: EmptyState Components
1. **[`web/shared/components/EmptyState.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/EmptyState.tsx)**
   - **Characteristics:** Comprehensive canonical implementation. Contains 12 built-in CRM module presets (`leads`, `customers`, `companies`, `deals`, `tasks`, `meetings`, `quotations`, `invoices`, `products`, `documents`, `reports`, `analytics`), ambient lighting backdrop, Lucide icon pill with glow, primary and secondary action buttons with Next.js link support.
   - **Usage Count:** ~15 pages and components.
2. **[`web/shared/components/crm/EmptyState.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/EmptyState.tsx)**
   - **Characteristics:** 21-line thin re-export wrapper with `LegacyEmptyStateProps` passing directly to `GlobalEmptyState`.
   - **Status:** Legacy adapter created for backward compatibility.
3. **[`web/features/leads/components/LeadEmptyState.tsx`](file:///d:/Projects/project/clixprocrm/web/features/leads/components/LeadEmptyState.tsx)**
   - **Characteristics:** Hardcoded lead-specific empty state wrapper with static illustration styling.
   - **Status:** Accidentally duplicated feature component; redundant with `EmptyState module="leads"`.
4. **[`web/features/calendar/components/EmptyState.tsx`](file:///d:/Projects/project/clixprocrm/web/features/calendar/components/EmptyState.tsx)**
   - **Characteristics:** 20-line local empty card.
   - **Status:** Accidentally duplicated; redundant with `EmptyState module="meetings"`.

---

### Group 2: Table Components (`DataTable` vs `CRMDataTable`)
1. **[`web/shared/components/crm/CRMDataTable.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMDataTable.tsx)**
   - **Characteristics:** Compound component model (`CRMTableHeader`, `CRMTableBody`, `CRMTableRow`, `CRMTableCell`, `CRMTableHeaderCell`). Directly consumes `crmTableStyles` (`.crm-table-wrap`, 64px row height `h-16`, 44px sticky table header).
   - **Usage Count:** Used across `Employees`, `ContactsTable`, `DealsTable`, `CompaniesTable`, `QuotationsTable`, `TasksTable`.
   - **Dominant Pattern:** Highly integrated with custom cell actions and interactive hover states.
2. **[`web/shared/components/DataTable.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/DataTable.tsx)**
   - **Characteristics:** Configuration-driven generic table taking `columns: DataTableColumn<T>[]` and `data: T[]`. Built-in skeleton loading rows and error fallback states.
   - **Usage Count:** Used in SuperAdmin and generic data views.
3. **[`web/shared/ui/table.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/ui/table.tsx)**
   - **Characteristics:** Base Radix-style HTML table primitive.

---

### Group 3: Status Badge Components
1. **[`web/shared/components/StatusBadge.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/StatusBadge.tsx)**
   - **Characteristics:** 69 lines. Takes `status: string`, `variant: "success" | "warning" | "danger" | "info" | "neutral" | "primary" | "amber" | "blue" | "indigo" | "rose" | "emerald" | "purple"`, `showDot?: boolean`, `pulse?: boolean`. Uses modern Tailwind arbitrary opacity classes (`bg-emerald-500/10`, `text-emerald-600 dark:text-emerald-400`).
   - **Dominant Pattern:** Modern, highly used in Tasks, Contacts, and Dashboard tables.
2. **[`web/shared/components/crm/CRMStatusBadge.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMStatusBadge.tsx)**
   - **Characteristics:** 45 lines. Takes `children: ReactNode`, `tone: "success" | "warning" | "danger" | "info" | "neutral" | "primary"`. Maps to older CSS utility classes (`.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`, `.badge-neutral`, `.badge-primary`) defined in `globals.css`.
   - **Status:** Legacy duplicate component.
3. **[`web/shared/ui/badge.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/ui/badge.tsx)**
   - **Characteristics:** Base CVA badge primitive with variant tokens (`default`, `secondary`, `destructive`, `outline`, `ghost`, `success`, `warning`, `info`).

---

### Group 4: Card Surfaces (`Card` vs `CRMCard`)
1. **[`web/shared/components/crm/CRMCard.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMCard.tsx)**
   - **Characteristics:** 95 lines. Integrated with `crmSurface.card` (`rounded-xl border border-border bg-card text-card-foreground shadow-card`), optional 4px colored accent left borders (`withAccent`, `accentColor`, `accentSeed`), and Framer Motion entry animations.
   - **Usage Count:** Primary card container in CRM feature views.
2. **[`web/shared/ui/card.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/ui/card.tsx)**
   - **Characteristics:** 110 lines. Traditional Shadcn compound card (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`). Supports `glass` and `elevated` props.
   - **Usage Count:** Primary card primitive for Dashboard widgets and static settings panels.

---

### Group 5: Search Inputs (`CRMSearchBar` vs `CRMToolbar`)
1. **[`web/shared/components/crm/CRMSearchBar.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMSearchBar.tsx)**
   - **Characteristics:** 35 lines. A standalone search input with search icon.
   - **Usage Count:** Orphaned / rarely referenced, because all CRM screens render search directly inside `<CRMToolbar />`.
2. **[`web/shared/components/crm/CRMToolbar.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMToolbar.tsx)**
   - **Characteristics:** Contains an integrated animated search input with live clear button (`X`), filter trigger button, and view mode toggle.
   - **Dominant Pattern:** Used across 100% of primary CRM list pages.
