# AI Coding Agent UI Consistency Rules

> **Target Audience:** All AI Coding Assistants, LLM Agents, and Developers  
> **Mandate:** Strict adherence required on every UI task in `clixprocrm`.  
> **Source Specification:** [`docs/DESIGN-SYSTEM.md`](file:///d:/Projects/project/clixprocrm/docs/DESIGN-SYSTEM.md)

---

## 15 Mandatory Rules for AI Coding Agents

### Rule 1: Reuse Canonical Components
Always check [`docs/DESIGN-SYSTEM.md`](file:///d:/Projects/project/clixprocrm/docs/DESIGN-SYSTEM.md) and [`docs/COMPONENT-DECISION-GUIDE.md`](file:///d:/Projects/project/clixprocrm/docs/COMPONENT-DECISION-GUIDE.md) before writing any JSX. Reuse the canonical component for that category. Never invent a local duplicate.

### Rule 2: No Arbitrary Tokens or Values
Never introduce ad-hoc CSS pixel heights, widths, margins, radii, or hex colors (e.g. `h-[38px]`, `rounded-[13px]`, `#123456`, `p-[18px]`). Use standard Tailwind spacing (`p-4`, `p-5`, `gap-4`) and semantic tokens (`--primary`, `--border`, `--card`, `--radius-lg`).

### Rule 3: Do Not Create Custom Button Variants
Use the canonical `<Button />` from `@/shared/ui/button`. It provides standard variants (`default`, `secondary`, `outline`, `ghost`, `destructive`, `premium`) and standard sizes (`default` h-10, `sm` h-9, `lg` h-11, `xs` h-8). Never use one-off classes like `h-8.5` or `h-7`.

### Rule 4: Preserve Two-Stage Scroll Architecture
All primary CRM CRUD and list pages (Contacts, Deals, Companies, Invoices, Quotations, Tasks, Employees) must use:
1. `<CRMPageContainer twoStageScroll>`
2. `<div className="crm-table-workspace-sticky">`
3. `<div className="crm-table-wrap">`
Never replace this two-stage scroll architecture with a generic full-page scroll.

### Rule 5: Never Bypass CRMDataTable with Raw `<table>` Tags
Always render data records using `<CRMDataTable>` (or `<DataTable>`). Never write manual `<table>`, `<thead>`, `<tbody>` markup directly in route pages. Maintain the standard 64px (`h-16`) row height and 44px (`h-11`) sticky header height.

### Rule 6: Never Use Custom Status Badge Markup
Always use `<StatusBadge status="..." variant="..." />` from `@/shared/components/StatusBadge`. Never write manual `<span>` or `<div>` tags for status pills.

### Rule 7: Never Create Local Empty State Components
Always use `<EmptyState module="..." action={{...}} />` from `@/shared/components/EmptyState`. It contains pre-built presets for 12 CRM modules, ambient lighting backdrops, and animated action buttons.

### Rule 8: Maintain Card Surface Hierarchy
- Standard feature card: `<CRMCard />` (`rounded-xl border border-border bg-card shadow-card p-4 sm:p-5`)
- KPI summary card: `<CRMMetricCard />` (3D pastel gradient + halftone pattern + sparkline)
- Widget card: `<DashboardWidgetWrapper />`
- Modal dialog: `<FormModal />` / `<DialogContent />` (`rounded-xl p-6 shadow-elevated`)

### Rule 9: Use Canonical Page Blueprint
Every standard module page must strictly follow the canonical layout sequence:
`CRMPageContainer` → `CRMPageHeader` → `CRMMetricsGrid` → `crm-table-workspace-sticky` (`CRMToolbar` → `CRMDataTable` → `CRMPagination`) → `ContextualSettingsDrawer`.

### Rule 10: In-Module Customizations Belong in ContextualSettingsDrawer
Never create deep standalone settings pages for module-specific preferences (such as lead sources, pipeline stages, or invoice numbering). Place them inside `<ContextualSettingsDrawer />` accessible via the `"Customize"` action in the page header.

### Rule 11: Inspect All Consumers Before Modifying Shared Components
If you modify a shared component in `@/shared/ui/` or `@/shared/components/crm/`, you MUST inspect all screens that import it across the repository to verify that your change does not break layout or styling elsewhere.

### Rule 12: Fix the Shared Component Instead of Patching Local Screens
If a shared component is misaligned or missing a variant, update the shared component systematically rather than applying localized CSS overrides, `!important` flags, or ad-hoc wrapper divs.

### Rule 13: Preserve Motion Tokens & Accessibility
Use transitions defined in `@/shared/lib/motion`. Respect `prefers-reduced-motion` settings. Never create bouncy, overshooting spring animations in business-critical CRM tables and forms.

### Rule 14: Use Semantic Colors in Metric Cards
When passing colors to `<CRMMetricCard color="..." />`, only use the valid canonical color keys: `emerald`, `indigo`, `orange`, `pink`, `cyan`, `violet`, `slate`. Do not pass unsupported keys like `"rose"` or `"amber"`.

### Rule 15: If In Doubt, Reference the Golden Screens
When implementing or debugging a screen, compare your layout against:
- **[Contacts (`/contacts`)](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/contacts/page.tsx)** for data table lists and CRUD flows.
- **[Deals (`/deals`)](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/deals/page.tsx)** for multi-view (Table, Grid, Kanban) flows.
- **[Dashboard (`/dashboard`)](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/dashboard/page.tsx)** for executive KPI grids and widget feeds.
