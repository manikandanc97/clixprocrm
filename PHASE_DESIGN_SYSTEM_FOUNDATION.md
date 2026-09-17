# ClixProCRM Design System Foundation — Audit, Inspiration & Standardization Proposal

> **Phase Status**: AUDIT + ARCHITECTURE + PROPOSAL ONLY  
> **Implementation Status**: NOT YET IMPLEMENTED (Awaiting Review & Approval)  
> **Objective**: Establish ONE coherent, scalable visual language for every page, module, component, modal, table, form, dashboard, and administrative screen in ClixProCRM.

---

## Executive Summary

The ClixProCRM Design System Foundation establishes a single, mathematically rigorous source of truth for the entire frontend application. 

```
INSPIRATION (Modern Enterprise SaaS)
    ↓
DESIGN DECISIONS (OKLCH, 4pt Grid, Semantic Tokens)
    ↓
CLIXPRO DESIGN SYSTEM (web/design-system/ & globals.css)
    ↓
CANONICAL SHARED COMPONENTS (CRMButton, CRMDataTable, CRMDialog, etc.)
    ↓
ALL APPLICATION UI (Tenant Dashboard & Super Admin)
```

This deliverable provides the complete UI audit of the existing codebase, categorizes all visual inconsistencies, extracts core inspiration principles, defines the proposed design tokens and canonical component architecture, outlines the multi-stage migration strategy, and lays down strict governance rules for future development.

---

## Phase 1 — Complete UI Audit

The frontend application (`web/`) was inspected across its layouts, shared primitives, CRM modules, dashboard features, and Super Admin command center.

### 1. Color System Audit
- **Core CSS Engine**: Tailwind CSS v4 with `@theme inline` bindings in `web/app/globals.css`.
- **Root Palette**: OKLCH color space. Default primary is Emerald (`oklch(0.58 0.165 157)`) in Light mode and (`oklch(0.68 0.16 157)`) in Dark mode, aligned with the brand emblem (`#32bd87`).
- **Accent System**: 10 selectable accent themes (`[data-accent="emerald | blue | violet | amber | rose | indigo | purple | red | teal | cyan"]`).
- **Dark Mode**: Configured via `.dark` class with dark slate surfaces (`oklch(0.12 0.015 265)` canvas, `oklch(0.16 0.018 265)` card).
- **Leaked Hardcoded Colors**:
  - `CRMMetricCard.tsx` contains 14 hardcoded pastel background hex codes (`bg-[#d7f4e3]`, `bg-[#ece3fc]`, `bg-[#fef3c7]`, `bg-[#fedcd2]`, `bg-[#dbeafe]`, `bg-[#cffafe]`, `bg-[#e0e7ff]`, `bg-[#f1f5f9]`).
  - Table headers in `table.tsx` and `CRMDataTable.tsx` hardcode `bg-emerald-50/80 dark:bg-emerald-950/40` and `border-emerald-500/20`, ignoring active accent themes.
  - Layout wrappers and hero sections use arbitrary dark hexes (`bg-[#0f172a]`, `bg-[#fafafa]`, `dark:bg-[#050505]`, `dark:bg-[#08090a]`).

### 2. Typography Audit
- **Font Stacks**: Display (`Trebuchet MS`, `Avenir Next`, `Segoe UI`), Sans (`Segoe UI`, `Helvetica Neue`), Mono (`Cascadia Mono`, `Consolas`).
- **Font Weights**: Dispersed usage of `font-normal`, `font-medium`, `font-semibold`, `font-bold`, `font-extrabold`, and `font-black`.
- **Text Sizing**: Scattered font sizes ranging from un-tokenized `text-[10px]` and `text-xs` to `text-3xl font-extrabold`.
- **Tracking & Leading**: Inconsistent tracking (`tracking-wider`, `tracking-widest`, `tracking-tight`) applied ad-hoc without semantic rules.

### 3. Spacing Audit
- **Page Container**: Standardized to `px-4 sm:px-6`, `pt-1`, `pb-6 sm:pb-8`, `gap-4 sm:gap-5` via `CRMPageContainer`.
- **Inner Card Paddings**: Varied between `p-3`, `p-3.5`, `p-4`, `p-5`, `p-6`.
- **Residual Page Spacers**: Isolated instances of `pb-10`, `pb-12`, and `space-y-6` conflicting with parent container gaps.

### 4. Shape & Radius Audit
- **Base Root Radius**: `--radius: 8px` (`rounded-md`).
- **Cards**: Vary between `rounded-xl` (12px), `rounded-2xl` (16px), and arbitrary `rounded-[22px]`.
- **Buttons**: Mix of `rounded-md` and `rounded-xl`.
- **Modals**: Mix of `rounded-xl`, `rounded-2xl`, and `rounded-b-xl`.
- **Avatars**: `rounded-lg` on square avatars vs `rounded-full` on badges and count chips.

### 5. Borders & Dividers Audit
- **Border Palette**: `--border: oklch(0.91 0.008 255)` and `oklch(0.24 0.018 265)`.
- **Border Opacities**: Scattered classes (`border-border/40`, `border-border/50`, `border-border/60`, `border-border/70`, `border-border/80`, `border-white/5`).

### 6. Shadows Audit
- **Shadow Scale**: Declared in CSS (`--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-card`, `--shadow-card-hover`, `--shadow-elevated`).
- **Shadow Inconsistencies**: Ad-hoc raw Tailwind shadow classes like `shadow-2xl`, `shadow-inner`, and `shadow-2xs` applied without semantic hierarchy.

### 7. Layout Audit
- **Shells**: `DashboardShell` (Tenant) and Super Admin layout wrapper.
- **Topbars**: Standard 58px fixed header.
- **Sidebars**: Floating left-docked sidebar (expanded 260px, collapsed 72px, top-3.5 left-3.5).
- **Two-Stage Scroll**: Implemented on `CRMPageContainer` for major list routes.

### 8. Components Audit
- **Primitives**: 27 Radix-based shadcn UI primitives in `web/shared/ui/`.
- **CRM Extensions**: 19 specialized CRM modules in `web/shared/components/crm/`.
- **Duplicate Implementations**: Discovered severe duplication between canonical CRM primitives and hand-rolled Super Admin components.

---

## Phase 2 — Current Inconsistencies Identified

| # | Category | Observed Inconsistency in Codebase |
| :--- | :--- | :--- |
| **1** | **Duplicate Styles** | Toolbars re-implemented manually in `OrganizationsToolbar`, `UsersTableToolbar`, and `AuditLogs` instead of reusing `CRMToolbar`. |
| **2** | **Arbitrary Values** | Hex values (`#d7f4e3`, `#ece3fc`, `#0f172a`, `#fafafa`), arbitrary radii (`rounded-[22px]`), and inline styles (`style={{ width: "160px" }}`). |
| **3** | **Conflicting Colors** | Table headers in `table.tsx` and `CRMDataTable.tsx` hardcoded to Emerald utilities (`bg-emerald-50/80`, `border-emerald-500/20`), breaking all non-emerald accent themes (`data-accent="blue"`, etc.). |
| **4** | **Inconsistent Spacing** | Card inner paddings vary between `p-3`, `p-3.5`, `p-4`, `p-5`, `p-6` without structural rationale. |
| **5** | **Inconsistent Typography** | Heading sizes fluctuate between `text-base font-bold`, `text-lg font-bold`, `text-xl font-black`, and `text-2xl font-extrabold`. |
| **6** | **Inconsistent Radius** | Modals and cards arbitrarily toggle between `rounded-xl` (12px) and `rounded-2xl` (16px). |
| **7** | **Inconsistent Button Sizes** | Buttons toggle between `h-8`, `h-9`, `h-10`, `h-11`, with manual utility overrides (`px-3.5 text-xs font-semibold`) applied repeatedly at call sites. |
| **8** | **Inconsistent Input Heights** | Inputs fluctuate between `h-9` (toolbar inputs) and `h-10` (form inputs) without an established size token scale. |
| **9** | **Inconsistent Card Styles** | Plain `<div>` with `bg-card border` vs shadcn `<Card>` vs `<CRMCard hoverable withAccent>`. |
| **10**| **Inconsistent Table Styles** | Declarative `<CRMDataTable>` used in Contacts, but raw HTML `<table>`, `<colgroup>`, and custom header logic used in Organizations, Users, and Security. |
| **11**| **Inconsistent Modal Layouts** | 12+ hand-rolled `fixed inset-0 z-50 flex items-center justify-center bg-black/60` raw divs in Super Admin and Billing, completely bypassing Radix Dialog, keyboard focus trap, and ARIA attributes. |
| **12**| **Inconsistent Empty States** | Canonical `<EmptyState>` vs custom hand-rolled dashed border divs with inline icons in `SuperAdminPlansPage` and reports. |
| **13**| **Inconsistent Loading States** | Unified `PageLoadingState` vs custom inline skeleton arrays (`Array.from({ length: 3 }).map(...)`) in Super Admin plans and organizations. |
| **14**| **Inconsistent Page Headers** | `<CRMPageHeader>` widely used, but secondary action button styling and breadcrumb nesting vary across routes. |
| **15**| **Inconsistent Section Headers**| Section headers alternate between `.crm-section-title`, raw `<h3>`, and CardTitle. |
| **16**| **Inconsistent Responsive Behavior**| Certain toolbars stack vertically on mobile while others overflow or hide filter dropdowns. |

---

## Phase 3 — Inspiration Research & Principles

Modern enterprise SaaS standards (Linear, Stripe, Raycast, Vercel Dashboard) were analyzed to establish foundational design principles:

1. **Information Hierarchy & Visual Density**:
   - High information density does not mean visual clutter. High density requires *higher contrast discipline* and *zero unnecessary borders*.
   - Tables must prioritize row scannability: left-aligned identifiers, right-aligned monetary values, center-aligned status pills.
2. **Surface Elevation & Layering**:
   - 4-level elevation model: Canvas (Level 0) → Contained Cards (Level 1) → Popovers/Dropdowns (Level 2) → Modal Overlays (Level 3).
   - Drop shadows are subtle and diffuse; elevation is primarily communicated through border contrast and background lightness shifts.
3. **Typography as Structure**:
   - Restrain font size variations. Structure is established through font weight (`400` vs `600`) and color contrast (`text-foreground` vs `text-muted-foreground`), not by jumping 6 different font sizes on a single card.
4. **Predictable Motion**:
   - Enterprise motion is fast and restrained (100–150ms). Zero bouncy spring overshoot. Respect `prefers-reduced-motion` unconditionally.

---

## Phase 4 — Proposed ClixPro Design System

### A. Color System (Semantic Tokens)

The system is 100% semantic and binds to Light and Dark modes:

```
Canvas / Base:
  --background          Canvas base (Light: oklch(0.985 0.002 247), Dark: oklch(0.12 0.015 265))
  --foreground          Primary text (Light: oklch(0.145 0.015 255), Dark: oklch(0.93 0.01 265))

Surfaces:
  --surface             Card & container panels (Light: oklch(1 0 0), Dark: oklch(0.16 0.018 265))
  --surface-muted       Table headers, filter bars (Light: oklch(0.96 0.004 250), Dark: oklch(0.20 0.018 265))
  --surface-elevated    Dropdowns, popovers, modals (Light: oklch(1 0 0), Dark: oklch(0.19 0.02 265))

Brand / Primary:
  --primary             Emerald #32bd87 aligned (Light: oklch(0.58 0.165 157), Dark: oklch(0.68 0.16 157))
  --primary-foreground  Light: oklch(0.99 0.005 157), Dark: oklch(0.12 0.015 265)

Secondary & Muted:
  --secondary           Light: oklch(0.95 0.008 255), Dark: oklch(0.20 0.02 265)
  --muted               Light: oklch(0.96 0.004 250), Dark: oklch(0.20 0.018 265)
  --muted-foreground    Light: oklch(0.52 0.015 255), Dark: oklch(0.58 0.015 265)

Semantic Status:
  --success             Light: oklch(0.58 0.165 157), Dark: oklch(0.65 0.16 157)
  --warning             Light: oklch(0.72 0.18 65),  Dark: oklch(0.76 0.18 65)
  --destructive         Light: oklch(0.58 0.22 25),  Dark: oklch(0.65 0.22 25)
  --info                Light: oklch(0.55 0.18 220), Dark: oklch(0.62 0.18 220)

Borders & Controls:
  --border              Light: oklch(0.91 0.008 255), Dark: oklch(0.24 0.018 265)
  --border-subtle       Light: oklch(0.91 0.008 255 / 0.5), Dark: oklch(0.24 0.018 265 / 0.5)
  --input               Light: oklch(0.91 0.008 255), Dark: oklch(0.24 0.018 265)
  --ring                Matches active --primary
```

### B. Typography System

| Level | Size | Weight | Line Height | Tracking | Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `24px / 30px` | `800` | `1.15` | `-0.035em` | Auth hero titles, landing screens |
| **H1** | `18px / 20px` | `700` | `1.25` | `-0.025em` | `CRMPageHeader` title |
| **H2** | `16px / 18px` | `700` | `1.30` | `-0.020em` | Section headers, card group titles |
| **H3** | `14px / 16px` | `600` | `1.35` | `-0.015em` | Widget titles, modal headers |
| **H4** | `13px / 14px` | `600` | `1.40` | `-0.010em` | Sub-sections, list group titles |
| **Body** | `14px` | `400 / 500` | `1.50` | `0` | Form labels, descriptions, modal content |
| **Body Small** | `12px` | `400 / 500` | `1.50` | `0` | Table cell data, card descriptions |
| **Label** | `12px` | `600` | `1.25` | `0` | Form field labels, input placeholders |
| **Caption** | `11px` | `400` | `1.40` | `0` | Timestamps, metadata annotations |
| **Overline** | `10px` | `700` | `1.20` | `+0.050em` | Badges, status pills, table headers |

### C. Spacing System

All spatial dimensions map to standard Tailwind 4pt increments:
- `p-1` (4px), `p-1.5` (6px), `p-2` (8px), `p-2.5` (10px), `p-3` (12px), `p-3.5` (14px), `p-4` (16px), `p-5` (20px), `p-6` (24px), `p-8` (32px).
- **Page Container Lateral Padding**: `px-4 sm:px-6`.
- **Page Vertical Gap**: `gap-4 sm:gap-5`.
- **Page Terminal Padding**: `pt-1 pb-6 sm:pb-8`.
- **Card Padding**: Standardized to `p-4 sm:p-5`. Toolbar padding standardized to `p-3 sm:p-3.5`.

### D. Radius System

| Token | Class | Value | Target |
| :--- | :--- | :--- | :--- |
| `sm` | `rounded-sm` | `6px` | Small dropdown items, sub-control chips |
| `md` | `rounded-md` | `8px` | Buttons, inputs, selects, segmented toggles |
| `lg` | `rounded-lg` | `10px` | Icon boxes, tabs list container |
| `xl` | `rounded-xl` | `12px` | Standard CRM cards, data tables, modals |
| `2xl`| `rounded-2xl` | `16px` | Floating sidebars, large marketing cards |
| `full`| `rounded-full` | `9999px` | Badges, status pills, avatars |

### E. Shadow System

| Token | Class | Light Mode Value | Purpose |
| :--- | :--- | :--- | :--- |
| `none` | `shadow-none` | `none` | Flat interior cards and table wrappers |
| `subtle` | `shadow-xs` | `0 1px 2px oklch(0 0 0 / 0.04)` | Buttons, inputs, select triggers |
| `card` | `shadow-card` | `0 1px 3px oklch(0 0 0 / 0.04), 0 1px 2px -1px oklch(0 0 0 / 0.03)` | Resting CRM cards |
| `card-hover`| `shadow-card-hover` | `0 4px 12px -2px oklch(0 0 0 / 0.06), 0 2px 4px -2px oklch(0 0 0 / 0.03)` | Interactive hoverable cards |
| `overlay` | `shadow-elevated`| `0 10px 30px -10px oklch(0 0 0 / 0.08)` | Modals, dropdown menus, popovers |

### F. Standard Component Sizing Scale

| Element | XS | SM | Default (MD) | LG |
| :--- | :--- | :--- | :--- | :--- |
| **Buttons** | `28px` (`h-7`) | `32px` (`h-8`) | `36px` (`h-9`) | `40px` (`h-10`) |
| **Inputs / Selects** | — | `32px` (`h-8`) | `36px` (`h-9`) | `40px` (`h-10`) |
| **Table Header** | — | — | `40px` (`h-10`) | — |
| **Table Data Rows** | — | `48px` (`h-12`) | `56px–64px` (`h-14 sm:h-16`) | — |
| **Badges** | `18px` | `20px` (`h-5`) | `24px` (`h-6`) | — |
| **Avatars** | — | `24px` (`size-6`) | `32px` (`size-8`) | `40px` (`size-10`) |

### G. Layout System
- **Viewport Inset**: 12px (`0.75rem`) viewport inset.
- **Top Navigation**: Fixed 58px bar with blur backdrop (`glass dark:glass-dark`).
- **Sidebar**: Fixed floating dock (`w-[260px]` expanded, `w-[72px]` collapsed).
- **Two-Stage Scroll Container**: Sticky search and filter docking at top with bounded table body scroll.

### H. Data Density Matrix

| Context | Density Mode | Row Height | Spacing | Target Modules |
| :--- | :--- | :--- | :--- | :--- |
| **CRM Tables** | Comfortable | `56px–64px` | `px-4 py-3.5` | Contacts, Leads, Invoices, Organizations, Users |
| **Admin Logs** | Compact | `48px` | `px-4 py-2` | Audit Logs, Security Incident Center |
| **Dashboards** | Spacious | Grid Gaps | `gap-4 sm:gap-5` | Main Dashboard, Analytics, Reports |
| **Forms / Modals** | Comfortable | Input Height | `h-9 / h-10` | LeadForm, CustomerForm, OrganizationModal |
| **Settings** | Comfortable | Gap Scale | `space-y-4` | Tenant Settings, Platform Settings |

### I. State Machine
- **Interactive**: Resting → Hover (`hover:border-primary/40`) → Active (`active:scale-[0.98]`) → Focus (`focus-visible:ring-2 focus-visible:ring-ring`).
- **Data Loading**: Structural skeletons (`TableSkeleton`, `ToolbarSkeleton`, `PageHeaderSkeleton`) with smooth shimmer.
- **Data Empty**: Unified `CRMEmptyState` with contextual icon, description, and primary CTA.
- **Data Error**: Unified `CRMErrorState` with retry callback.

### J. Motion Standards
- **Micro**: 100ms (instant button press, toggle).
- **Fast**: 150ms (popovers, dropdowns).
- **Normal**: 200ms (modals, dialogs, tabs).
- **Easing**: Smooth decelerating cubic-bezier `[0.16, 1, 0.3, 1]`.
- **A11y**: Global `prefers-reduced-motion: reduce` completely disables transform scales and long animations.

---

## Phase 5 — Canonical Component Architecture

The canonical system eliminates style duplication and standardizes props:

```
CRMPageContainer        Single source of truth for page bounds, rhythm & two-stage scroll
CRMPageHeader           Page titles, breadcrumbs, badges, structured primary/secondary actions
CRMToolbar              Unified search bar, filter triggers, bulk action dock, view mode toggle
CRMDataTable            Declarative data source, sorting, selection, skeleton loading, empty states
CRMTable                Underlying styled HTML table primitive
CRMCard                 Surface container with standardized padding, hover and accent borders
CRMDialog               Accessible Radix-backed modal dialog
CRMDrawer               Accessible slide-over inspector sheet
CRMButton               CVA-backed button primitive with standard height scale (xs, sm, default, lg)
CRMInput                Styled input with floating/inline icon support and invalid ring states
CRMSelect               Radix Select primitive with consistent trigger height and popover alignment
CRMTextarea             Consistent auto-resizing multi-line text input
CRMBadge                Status, plan, and role badges with semantic color variants
CRMAvatar               Squircle/circle user and organization avatar with fallback initials
CRMTabs                 Segmented navigation tabs with smooth active glider
CRMTooltip              Informational popover tips with delayed entrance
CRMAlert                Dismissible inline alert banners with severity tones
CRMToast                Sonner toast notifications with action buttons
CRMSkeleton             Theme-aware shimmer placeholders
CRMEmptyState           Empty dataset state with icon, copy, and action button
CRMErrorState           API/Network failure fallback card with retry action
CRMStatCard             KPI card with trend indicator and sparkline graph
CRMPagination           Record counts, page navigation, and rows-per-page selector
```

---

## Phase 6 — Design System Documentation Structure

The design system documentation is maintained inside `web/design-system/`:

```
web/design-system/
├── README.md          # Design philosophy, architectural principles & commandments
├── tokens.md          # Complete token dictionary, CSS variables & Tailwind v4 bindings
├── colors.md          # OKLCH color palettes, contrast compliance & dynamic accent engine
├── typography.md      # Font hierarchy, scale, leading, tracking & tabular numerics
├── spacing.md         # 4-point spacing scale, page padding & card padding matrix
├── layout.md          # Application shell, fixed offsets, grid system & two-stage scroll
├── components.md      # Canonical component specifications & API contracts
├── states.md          # Interactive control states, form validation & full-page states
├── motion.md          # Durations, easings, interaction scales & reduced-motion rules
└── responsive.md      # Breakpoints, mobile adaptations & touch target rules
```

---

## Phase 7 — Token Implementation Plan

Tokens will be implemented strictly within the existing application architecture without introducing parallel or competing theme engines:

1. **`web/app/globals.css`**:
   - Update `:root` and `.dark` blocks to declare all semantic surface tokens (`--surface`, `--surface-muted`, `--surface-elevated`).
   - Standardize table header tokens (`--crm-table-header-bg`, `--crm-table-header-border`) using `var(--surface-muted)` and `var(--border)` so they adapt automatically to all 10 accent themes.
   - Remove hardcoded hex codes from utility layers.
2. **Tailwind CSS v4 `@theme inline`**:
   - Map all CSS custom properties to Tailwind utility tokens (`color-surface`, `color-surface-muted`, `radius-xl`, etc.).
3. **`web/shared/lib/design-system.ts`**:
   - Centralize TypeScript constants for `crmRadius`, `crmSurface`, `crmControl`, and `crmTypography`.

---

## Phase 8 — Multi-Phase Migration Strategy

To guarantee zero regression and continuous application stability, implementation will occur in structured phases:

```
Phase A: Foundation
  └── globals.css token cleanup, table header tokenization, design-system.ts constants

Phase B: Canonical Primitives
  └── Standardize CRMButton, CRMInput, CRMSelect, CRMBadge, CRMCard, CRMDialog

Phase C: Core Shared CRM Modules
  └── Refactor CRMDataTable, CRMToolbar, CRMPageHeader, PageFeedbackStates

Phase D: Tenant Dashboard
  └── Align /dashboard, /contacts, /tasks, /invoices, /quotations, /companies, /deals

Phase E: Super Admin Platform
  └── Replace 12+ hand-rolled modal divs with CRMDialog
  └── Replace raw tables in Organizations, Users, Security with CRMDataTable
  └── Replace raw toolbars with CRMToolbar

Phase F: Final Regression & Typecheck
  └── Execute npx tsc --noEmit, test suite, and visual cross-browser validation
```

---

## Phase 9 — Governance Rules

### DO:
- **DO** use semantic design tokens (`bg-card`, `text-primary`, `border-border`, `rounded-xl`).
- **DO** use canonical shared components (`CRMButton`, `CRMDataTable`, `CRMDialog`, `CRMToolbar`).
- **DO** use the 4-point spacing scale (`p-3`, `p-4`, `p-5`, `gap-4 sm:gap-5`).
- **DO** wrap data-dense tables in `CRMPageContainer twoStageScroll`.
- **DO** use `tabular-nums` on all currency, percentage, and metric figures.
- **DO** test all new screens against both Light mode and Dark mode with multiple accent colors.

### DON'T:
- **DON'T** hardcode arbitrary hex colors (`bg-[#0f172a]`, `text-[#059669]`).
- **DON'T** hand-roll modal overlays with `fixed inset-0 z-50 flex items-center justify-center bg-black/60`.
- **DON'T** write raw HTML `<table>` elements on feature pages.
- **DON'T** invent new button heights or ad-hoc padding values.
- **DON'T** create page-specific design tokens or bypass the canonical design system.
- **DON'T** introduce heavy spring animations that cause layout shifts.

---

## Phase 10 — Inventory of Files for Subsequent Implementation Phase

When implementation begins, the following files will be refactored:

### 1. Foundation & Styles
- `web/app/globals.css`
- `web/shared/lib/design-system.ts`
- `web/shared/ui/table.tsx`
- `web/shared/ui/dialog.tsx`
- `web/shared/ui/button.tsx`
- `web/shared/ui/badge.tsx`

### 2. Canonical Shared Components
- `web/shared/components/crm/CRMCard.tsx`
- `web/shared/components/crm/CRMDataTable.tsx`
- `web/shared/components/crm/CRMToolbar.tsx`
- `web/shared/components/crm/CRMMetricCard.tsx`
- `web/shared/components/crm/FormModal.tsx`
- `web/shared/components/crm/PageFeedbackStates.tsx`

### 3. Super Admin Surfaces
- `web/app/(super-admin)/super-admin/plans/page.tsx`
- `web/app/(super-admin)/super-admin/plans/components/PlanEditorModal.tsx`
- `web/app/(super-admin)/super-admin/plans/components/PlanDeleteDialog.tsx`
- `web/app/(super-admin)/super-admin/security/page.tsx`
- `web/app/(super-admin)/super-admin/security/operations/components/SecOpsModals.tsx`
- `web/app/(super-admin)/super-admin/organizations/page.tsx`
- `web/app/(super-admin)/super-admin/organizations/components/OrganizationsTable.tsx`
- `web/app/(super-admin)/super-admin/organizations/components/OrganizationsToolbar.tsx`
- `web/app/(super-admin)/super-admin/organizations/components/CreateOrganizationModal.tsx`
- `web/app/(super-admin)/super-admin/organizations/components/OrganizationDetailsModal.tsx`
- `web/app/(super-admin)/super-admin/organizations/components/OrganizationDeleteDialogs.tsx`
- `web/app/(super-admin)/super-admin/users/page.tsx`
- `web/app/(super-admin)/super-admin/users/components/UsersTable.tsx`
- `web/app/(super-admin)/super-admin/users/components/UsersTableToolbar.tsx`
- `web/app/(super-admin)/super-admin/users/components/UserModals.tsx`
- `web/app/(super-admin)/super-admin/billing/page.tsx`
- `web/app/(super-admin)/super-admin/billing/components/BillingInvoiceViewModal.tsx`
- `web/app/(super-admin)/super-admin/billing/components/BillingRefundModal.tsx`
- `web/app/(super-admin)/super-admin/billing/components/BillingSubscriptionModal.tsx`
- `web/app/(super-admin)/super-admin/audit-logs/page.tsx`

### 4. Tenant Dashboard Surfaces
- `web/features/dashboard/components/WelcomeBanner.tsx`
- `web/features/dashboard/components/DashboardWidgetWrapper.tsx`
- `web/app/(dashboard)/contacts/page.tsx`
- `web/features/contacts/components/ContactsDataTable.tsx`
- `web/app/(dashboard)/tasks/page.tsx`
- `web/app/(dashboard)/quotations/page.tsx`
- `web/app/(dashboard)/invoices/page.tsx`
- `web/app/(dashboard)/companies/page.tsx`
- `web/app/(dashboard)/employees/page.tsx`

---

## Conclusion & Next Steps

This document and the companion documentation files in `web/design-system/` complete the **Inspiration + Design System Standardization Foundation Phase**. 

**No application code has been modified in this phase.**  
Following review and approval, Phase A of the Migration Strategy can proceed.
