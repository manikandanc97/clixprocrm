# CRM Design System Audit — UI Consistency Audit

> **Audit Date:** September 2026  
> **Repository:** `clixprocrm`  
> **Rule:** Objective extraction of current differences. Do not invent new designs; identify the dominant canonical pattern based on usage.

---

## 1. Summary of Identified Inconsistencies

| # | Inconsistency Area | Dominant / Canonical Pattern | Deviations Found | Severity |
| :- | :--- | :--- | :--- | :--- |
| **1** | **Status Badge Implementation** | `<StatusBadge />` / `<Badge />` with standardized `rounded-full text-[10px] font-bold uppercase tracking-wider` | Invoices screen uses custom inline `<span>` elements with `text-[11px] rounded-full`. Employees uses `<CRMStatusBadge tone="...">` with legacy CSS classes (`.badge-success`). | **High** |
| **2** | **Table Container & Row Markup** | `<CRMDataTable />` or `<DataTable />` consuming standard `crmTableStyles` (`.crm-table-wrap`, 64px `h-16` rows, 44px `h-11` headers) | Invoices page ([`invoices/page.tsx:341`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/invoices/page.tsx#L341)) constructs a manual raw `<table>` with `text-xs py-3 px-4`, deviating from standard cell heights and typography. | **High** |
| **3** | **Card Radius & Corner Radii** | `rounded-xl` (12px) for general cards (`CRMCard`, `Card`, dialogs, tables) | `CRMMetricCard` and `CRMPagination` use `rounded-2xl` (16px), creating mixed border-radius geometry on the same page. | **Medium** |
| **4** | **Button Height & Padding Variations** | `h-9 px-3 text-xs` (Small) and `h-10 px-4 text-sm` (Default) | In ContextualSettingsDrawer ([`ContextualSettingsDrawer.tsx:231`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/ContextualSettingsDrawer.tsx#L231)), buttons use non-standard `h-8.5 px-3.5` and `h-8.5 px-4`. In Invoices actions ([`invoices/page.tsx:476`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/invoices/page.tsx#L476)), buttons use `h-7 w-7`. | **Medium** |
| **5** | **Search Field Styling in Toolbars** | Standardized `Input` with border in regular forms; `CRMToolbar` uses `border-transparent bg-muted/40 pl-9` | In Super Admin search bars ([`super-admin-header.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(super-admin)/components/super-admin-header.tsx)), inputs use `border-border bg-background/50 pl-10 h-9`. | **Low** |
| **6** | **Two-Stage Scroll Container Structure** | `.crm-table-workspace-sticky` applied directly to single-column table/grid wrappers | On Employees page ([`employees/page.tsx:226`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/employees/page.tsx#L226)), `.crm-table-workspace-sticky` is modified with `!grid grid-cols-1 lg:grid-cols-4`, altering the sticky height boundary behavior. | **High** |
| **7** | **Metric Card Color Prop Taxonomy** | Semantic pastel gradient names (`emerald`, `indigo`, `orange`, `pink`, `violet`, `cyan`, `blue`, `slate`) | Reports page maps `positive ? "up" : "down"` dynamically with a secondary array (`["indigo", "violet", "emerald", "rose", "pink", "cyan", "amber", "blue"]`) where `"rose"` and `"amber"` are passed instead of `"pink"` and `"orange"`. | **Medium** |
| **8** | **Empty State Preset vs Custom Markup** | `<EmptyState module="leads" />` consuming `MODULE_PRESETS` | Contacts page ([`contacts/page.tsx:223`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/contacts/page.tsx#L223)) overrides presets with custom title/description, whereas other modules pass only `module="deals"`. | **Low** |
| **9** | **Action Icon Sizing in Tables & Dropdowns** | Standardized `size-4` (16px) across Radix DropdownMenu items | Quotations table dropdown items use `w-3.5 h-3.5` (14px), Invoices uses `w-3.5 h-3.5`, while BaseSidebar and Toolbar use `size={18}` / `size={16}`. | **Low** |
| **10** | **Custom Scrollbar Class Fragmentation** | `.sidebar-scroll` (auto-hide) and `.custom-scrollbar` | Four duplicate classes exist in `globals.css`: `.no-scrollbar`, `.hide-scrollbar`, `.scrollbar-hide`, `.scrollbar-none` and `.custom-scrollbar`, `.thin-scrollbar`, `.scrollbar-thin`. | **Medium** |

---

## 2. Detailed Inconsistency Reports

### Issue 1: Status Badge Fragmentation & Inconsistent Markup
- **Affected Screens:** Invoices (`/invoices`), Employees (`/employees`), Contacts (`/contacts`), Deals (`/deals`), Tasks (`/tasks`).
- **Current Implementation:**
  - Invoices ([`invoices/page.tsx:149-184`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/invoices/page.tsx#L149-L184)): Renders bespoke `<span>` tags with `px-2.5 py-0.5 rounded-full text-[11px] font-bold` and inline icon components (`<CheckCircle2 />`, `<Clock />`, `<AlertCircle />`).
  - Employees ([`employees/page.tsx:314`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/employees/page.tsx#L314)): Uses `<CRMStatusBadge tone="success">` which applies `.badge-success` (defined in `globals.css`).
  - Tasks & Contacts: Uses `<StatusBadge variant="success" showDot />` (defined in `web/shared/components/StatusBadge.tsx`).
- **Expected / Canonical Pattern:** `<StatusBadge />` or `<Badge variant="...">` with `text-[10px] font-bold uppercase tracking-wider rounded-full`.
- **Source Token / Component:** [`web/shared/components/StatusBadge.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/StatusBadge.tsx) vs [`web/shared/components/crm/CRMStatusBadge.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMStatusBadge.tsx) vs [`web/shared/ui/badge.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/ui/badge.tsx).
- **Severity:** **High**

---

### Issue 2: Table Implementation Disparity in Invoices Module
- **Affected Screens:** Invoices (`/invoices`) vs Contacts, Deals, Companies, Quotations, Employees.
- **Current Implementation:**
  - Contacts, Deals, Companies, Quotations: Use `<CRMDataTable>` / `<DataTable>` with 64px row height (`h-16`), 44px sticky table head (`h-10 sm:h-11`), `text-[12px] uppercase font-semibold text-muted-foreground` headers, and `crmTableStyles`.
  - Invoices ([`invoices/page.tsx:341-508`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/invoices/page.tsx#L341-L508)): Bypasses `CRMDataTable` and renders a raw `<table>` with `text-xs`, manual `<th className="py-3 px-4">`, `<tr className="hover:bg-muted/30">`, differing from the rest of the CRM.
- **Expected / Canonical Pattern:** `<CRMDataTable>` / `<DataTable>` consuming `crmTableStyles` with standardized row height and cell paddings.
- **Source Component:** [`web/shared/components/crm/CRMDataTable.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMDataTable.tsx).
- **Severity:** **High**

---

### Issue 3: Container Radius & Component Elevation Disparity
- **Affected Screens:** All primary list pages (`Contacts`, `Deals`, `Companies`, `Invoices`, `Quotations`, `Tasks`, `Employees`).
- **Current Implementation:**
  - Table containers (`.crm-table-wrap`), general cards (`CRMCard`), search bars (`CRMToolbar`), dialogs (`DialogContent`): `rounded-xl` (12px / `--radius-lg`).
  - Metric cards (`CRMMetricCard`): `rounded-2xl` (16px).
  - Pagination bars (`CRMPagination`): `rounded-2xl` (16px).
  - Auth card (`auth-card`): `rounded-[22px]`.
- **Expected / Canonical Pattern:** Standardized `rounded-xl` (12px) for card containers and `rounded-2xl` (14px capped) for large modal surfaces.
- **Source Token:** `--crm-radius-card` (12px) vs `--radius-xl` (14px) vs hardcoded `rounded-2xl` (16px).
- **Severity:** **Medium**

---

### Issue 4: Arbitrary Button Sizing in Contextual Drawers & Actions
- **Affected Screens:** Contextual Settings Drawers, Invoices action buttons.
- **Current Implementation:**
  - Button primitive defines 7 standard sizes: `default` (h-10), `sm` (h-9), `lg` (h-11), `xs` (h-8), `icon` (10), `icon-sm` (9), `icon-xs` (8).
  - `ContextualSettingsDrawer.tsx:231, 243, 277, 281`: Uses arbitrary one-off class `h-8.5` (34px) instead of standard `h-8` or `h-9`.
  - `invoices/page.tsx:476`: Action trigger button uses `h-7 w-7` (28px).
- **Expected / Canonical Pattern:** `Button size="sm"` (`h-9`) or `Button size="xs"` (`h-8`).
- **Source Component:** [`web/shared/ui/button.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/ui/button.tsx).
- **Severity:** **Medium**

---

### Issue 5: Employees Sticky Workspace Layout Break
- **Affected Screens:** Employees (`/employees`).
- **Current Implementation:**
  - In Contacts, Deals, Companies, Invoices, Quotations, Tasks: `.crm-table-workspace-sticky` wraps a single vertical stack (`CRMToolbar` + Table Container + Pagination).
  - In Employees ([`employees/page.tsx:226`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/employees/page.tsx#L226)): `.crm-table-workspace-sticky` is combined with `!grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8` to hold both the table and two sidebar sections (`Recent Activity` and `Performance Overview`). When table has pagination or rows scroll, the right sidebar height can mismatch viewport bounds.
- **Expected / Canonical Pattern:** Sticky workspace should encapsulate the scrollable list container, with sidebars handled via dedicated grid columns or drawer sheets.
- **Source File:** [`web/app/(dashboard)/employees/page.tsx:226`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/employees/page.tsx#L226).
- **Severity:** **High**

---

### Issue 6: Metric Card Color Taxonomy Mismatch
- **Affected Screens:** Reports (`/reports`), Dashboard (`/dashboard`).
- **Current Implementation:**
  - `CRMMetricCard.tsx` configures 10 color keys: `emerald`, `violet`, `purple`, `orange`, `pink`, `cyan`, `indigo`, `blue`, `slate`, `primary`.
  - `reports/page.tsx:242, 249`: Passes `"rose"` and `"amber"` which fallback to `"indigo"` because they are not exact keys in `COLOR_TOKENS` (where they are named `"pink"` and `"orange"`).
- **Expected / Canonical Pattern:** Use canonical `MetricColor` keys (`emerald`, `indigo`, `orange`, `pink`, `cyan`, `violet`, `slate`).
- **Source File:** [`web/shared/components/crm/CRMMetricCard.tsx:46-187`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMMetricCard.tsx#L46-L187).
- **Severity:** **Medium**
