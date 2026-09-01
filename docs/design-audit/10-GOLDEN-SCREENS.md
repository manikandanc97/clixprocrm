# CRM Design System Audit — Golden / Reference Screen Candidates

> **Audit Date:** September 2026  
> **Repository:** `clixprocrm`  
> **Rule:** Objective selection of reference screens exhibiting the highest consistency, complete design pattern implementation, and architectural maturity for future alignment.

---

## 1. Reference Screen Candidates Ranking

```
┌──────┬──────────────────────────────┬────────────────────────┬────────────────────────────────────────────────────────┐
│ Rank │ Screen & Route               │ Screen Category        │ Why It Qualifies as a Golden Reference                 │
├──────┼──────────────────────────────┼────────────────────────┼────────────────────────────────────────────────────────┤
│ 🥇 1 │ Contacts (/contacts)         │ Data Table & CRUD      │ Flawless two-stage scroll, complete 3D metric cards,   │
│      │                              │                        │ URL filter sync, contextual drawer integration, presets│
├──────┼──────────────────────────────┼────────────────────────┼────────────────────────────────────────────────────────┤
│ 🥈 2 │ Deals & Pipeline (/deals)    │ Multi-View & Workflow  │ Multi-view benchmark (Table, Grid, Kanban Pipeline),   │
│      │                              │                        │ currency formatting, probability math, deal settings   │
├──────┼──────────────────────────────┼────────────────────────┼────────────────────────────────────────────────────────┤
│ 🥉 3 │ Executive Dashboard          │ Dashboard & KPIs       │ Zero-state onboarding hub fallback, live timeframe     │
│      │ (/dashboard)                 │                        │ switcher, 3:1 operational grid, sticky widgets         │
├──────┼──────────────────────────────┼────────────────────────┼────────────────────────────────────────────────────────┤
│ 4    │ Invoices (/invoices)         │ Financial & Records    │ Rich metric aggregations, payment modals, detail sheet,│
│      │                              │                        │ dynamic currency formatting                            │
├──────┼──────────────────────────────┼────────────────────────┼────────────────────────────────────────────────────────┤
│ 5    │ Settings (/settings)         │ Configuration & Hub    │ Deep RBAC validation, URL query navigation, decoupled  │
│      │                              │                        │ independent vertical scroll, clean motion transitions  │
└──────┴──────────────────────────────┴────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Reference Screen Evaluations

### 🥇 Golden Screen 1: Contacts (`/contacts`)
- **Primary Source File:** [`web/app/(dashboard)/contacts/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/contacts/page.tsx)
- **Strengths & Consistency Highlights:**
  1. **Two-Stage Scroll Architecture:** Uses `CRMPageContainer twoStageScroll` with `.crm-table-workspace-sticky` perfectly calculating `--sa-header-h` offset.
  2. **3D Pastel Metric Cards:** Three balanced cards (`Total Contacts`, `Active Customers`, `Active Leads`) using color tokens (`indigo`, `emerald`, `orange`) with smooth sparklines.
  3. **URL State Synchronization:** Bi-directional URL synchronization for status filters (`?status=lead`, `?status=customer`) and drawer triggers (`?customize=sources`).
  4. **Component Reuse:** Consumes `CRMPageHeader`, `CRMMetricsGrid`, `CRMToolbar`, `FormModal`, `EmptyState`, `BulkImportModal`, and `ContactContextualSettings`.
  5. **Empty State Fidelity:** Context-aware empty state dynamically rendering lead or customer presets based on active filter.

---

### 🥈 Golden Screen 2: Deals & Pipeline (`/deals`)
- **Primary Source File:** [`web/app/(dashboard)/deals/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/deals/page.tsx)
- **Strengths & Consistency Highlights:**
  1. **Unified Multi-View Controller:** Seamlessly toggles between List View (`DealsTable`), Grid View (`DealsGrid`), and Kanban Board (`PipelineBoard`) without breaking container layouts.
  2. **Dynamic Pipeline Metrics:** KPI cards intelligently shift metrics based on view mode (e.g. switching from *Deals Won* to *Stuck Deals* when entering pipeline view).
  3. **Real-Time Currency Formatting:** Values react dynamically to global currency changes via `useCRMStore`.
  4. **Contextual Settings Integration:** Embeds `DealContextualSettings` for in-module pipeline stage and probability tuning.

---

### 🥉 Golden Screen 3: Executive CRM Dashboard (`/dashboard`)
- **Primary Source File:** [`web/app/(dashboard)/dashboard/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/dashboard/page.tsx)
- **Strengths & Consistency Highlights:**
  1. **Intelligent Onboarding Zero-State:** Automatically detects whether workspace has CRM records; if 0 records exist, cleanly replaces complex dashboard with interactive `<DashboardOnboardingHub />`.
  2. **Timeframe Switcher:** Seamless pill controls (`today`, `week`, `month`, `year`) wired to global store.
  3. **Asymmetric 3:1 Grid Layout:** Clean desktop layout placing operational charts and follow-up feeds in main column, while sticky revenue targets and calendar sit in right rail.
  4. **Granular Skeleton Loaders:** Individual widget wrapper skeletons (`DashboardWidgetSkeleton`) prevent layout shifts.

---

### Reference Screen 4: Settings Hub (`/settings`)
- **Primary Source File:** [`web/app/(dashboard)/settings/page.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/settings/page.tsx)
- **Strengths & Consistency Highlights:**
  1. **Permission-Aware Routing:** Automatically validates whether user role has access to the requested section and falls back gracefully to authorized sections.
  2. **Backward-Compatibility Redirects:** Handles legacy section deep-links with instant client-side routing to new contextual drawer locations.
  3. **Decoupled Scroll Container:** Full-height container with independent `.sidebar-scroll` and automatic scroll-to-top on section switch.
