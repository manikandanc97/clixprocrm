# ClixProCRM Component Decision Guide

> **Purpose:** Practical decision matrix answering "When should I use which component?" to prevent component duplication and styling fragmentation.  
> **Source Specification:** [`docs/DESIGN-SYSTEM.md`](file:///d:/Projects/project/clixprocrm/docs/DESIGN-SYSTEM.md)

---

## 1. Quick Decision Matrix

```
┌──────────────────────────────────────┬──────────────────────────────────────────┬────────────────────────────────────────────────────────┐
│ UI Requirement                       │ DO USE THIS (Canonical)                  │ DO NOT USE (Legacy / Discouraged)                      │
├──────────────────────────────────────┼──────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Text Action Button                   │ <Button variant="..." size="...">        │ Custom styled <button> with ad-hoc heights             │
│ Icon-Only Action Button              │ <Button size="icon" or size="icon-sm">   │ Custom square div with click handler                   │
│ Data Record Status Indicator         │ <StatusBadge status="..." variant="..."> │ <CRMStatusBadge>, inline <span> with custom classes    │
│ User Role Indicator                  │ <CRMRoleBadge role="..." />              │ Generic <Badge> or unstyled text                       │
│ Subscription Tier Indicator          │ <PlanBadge /> or <PlanBadgePopover />    │ Hardcoded text badges                                  │
│ CRM Entity List Table                │ <CRMDataTable> compound structure        │ Raw <table> tags or ad-hoc <tr> elements               │
│ Schema-Driven Admin Table            │ <DataTable columns={...} data={...} />   │ Manually mapping arrays into raw tables                │
│ Standard Content Card                │ <CRMCard />                              │ Raw <div> with shadow-card                             │
│ Executive KPI Stat Card              │ <CRMMetricCard />                        │ <MetricCard /> legacy wrapper                          │
│ Module Search & Filter Row           │ <CRMToolbar />                           │ Isolated <Input> + separate button rows                │
│ Global Command Search                │ <GlobalSearch />                         │ In-page search fields for global navigation            │
│ Module / List Zero-State             │ <EmptyState module="..." />              │ <LeadEmptyState>, <calendar/EmptyState> local copies   │
│ Entity CRUD Form Modal               │ <FormModal />                            │ <Dialog> without standard header/footer wrappers       │
│ In-Module Preference Configuration   │ <ContextualSettingsDrawer />             │ Creating separate pages under /settings                │
│ Table Data Pagination                │ <CRMPagination />                        │ Inline next/prev buttons without row count selector    │
└──────────────────────────────────────┴──────────────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 2. In-Depth Category Guides

### 2.1 Buttons: Standard vs Icon-Only
- **Text Button:** Use `<Button variant="default" size="default">` (h-10 / 40px) or `size="sm"` (h-9 / 36px).
- **Icon-Only Button:** Use `<Button size="icon">` (size-10 / 40px) or `<Button size="icon-sm">` (size-9 / 36px) with `variant="ghost"` or `variant="outline"`. Always include `<span className="sr-only">Label</span>` for screen readers.
- **Never create custom button heights** (like `h-8.5` or `h-7`).

---

### 2.2 Badges: Status vs Role vs Tier
- **Entity Status (Active, Won, Overdue, Paid):** Use `<StatusBadge status="ACTIVE" variant="success" />` from `@/shared/components/StatusBadge`.
- **System User Role (Admin, Sales Rep, Employee):** Use `<CRMRoleBadge role={user.role} />` from `@/shared/components/crm/CRMRoleBadge`.
- **Pricing & Quota Plan (Free, Pro, Enterprise):** Use `<PlanBadge />` or `<PlanBadgePopover />` from `@/shared/components/PlanBadgePopover`.
- **Never render raw `<span className="rounded-full bg-emerald-500 text-xs">` tags.**

---

### 2.3 Tables: `CRMDataTable` vs `DataTable` vs Raw `<table>`
- **Use `<CRMDataTable>`** when building core CRM entity tables (Contacts, Deals, Companies, Invoices, Quotations, Tasks, Employees) that require custom row click interactions, interactive avatar columns, or dynamic dropdown action menus.
- **Use `<DataTable>`** when building generic, schema-driven data grids where columns can be defined purely as a JSON configuration array with built-in automatic sorting and error states.
- **Never use raw `<table>` tags directly on pages.**

---

### 2.4 Cards: `CRMCard` vs `CRMMetricCard` vs `Card`
- **Use `<CRMMetricCard>`** for high-level KPI cards at the top of pages (3D pastel gradient background, halftone dot pattern, sparkline curve, 3D icon pill).
- **Use `<CRMCard>`** for secondary content panels, list cards, and detail sidebar sections. Supports left color accent borders (`withAccent`).
- **Use primitive `<Card>`** for dashboard widget containers and simple static panels.

---

### 2.5 Search: `CRMToolbar` vs Standalone Input vs `GlobalSearch`
- **For Module Records (Filtering tables/grids):** Use the integrated search field inside `<CRMToolbar searchQuery={q} setSearchQuery={setQ} />`. It includes instant-clear `X` triggers and auto-responsive collapse.
- **For Cross-Platform Navigation:** Use `<GlobalSearch />` in the Topbar (Command-K modal).
- **Do not use the orphaned `<CRMSearchBar />` component.**

---

### 2.6 Empty States: `EmptyState` vs Local Copies
- **Always use `<EmptyState module="..." />`** from `@/shared/components/EmptyState`. It has built-in presets for 12 CRM modules (`leads`, `customers`, `deals`, `companies`, `invoices`, `quotations`, `tasks`, etc.) with ambient glows, icon pills, and dual call-to-action buttons.
- **Do not create feature-specific empty states** (like `LeadEmptyState` or `calendar/EmptyState`).

---

### 2.7 Overlays: `Dialog` vs `Sheet` vs `ContextualSettingsDrawer`
- **Modal Popup (`<FormModal />` / `<Dialog />`):** Use for focused CRUD entity creation, edit forms, and confirmation alerts (`<AlertDialog />`).
- **Side Drawer (`<Sheet />`):** Use for detailed read-only previews and mobile navigation.
- **Contextual In-Module Drawer (`<ContextualSettingsDrawer />`):** Use when the user clicks `"Customize"` on a module page to adjust field visibility, pipeline stages, numbering series, or automated workflows.
