# CRM Design System Audit — Visual Canonical Patterns

> **Audit Date:** September 2026  
> **Repository:** `clixprocrm`  
> **Rule:** Identification of the CURRENT strongest and most consistent visual patterns across the application.

---

## 1. Inventory of Dominant Visual Patterns

```
┌───────────────────────────────────────────────┬──────────────────────────────────┬────────────────────────┐
│ Pattern Category                              │ Dominant Implementation          │ Screen Adoption Rate   │
├───────────────────────────────────────────────┼──────────────────────────────────┼────────────────────────┤
│ 1. Page Header                                │ <CRMPageHeader />                │ 100% of Module Pages   │
│ 2. Primary CTA Action                         │ Button variant="default" (h-9)   │ 100% of Module Pages   │
│ 3. Secondary CTA Action                       │ Button variant="outline" (h-9)   │ 100% of Module Pages   │
│ 4. KPI Metric Cards                           │ <CRMMetricCard /> (3D Pastel)    │ 85% of Module Pages    │
│ 5. Table & Workspace Layout                   │ Two-Stage Scroll Workspace       │ 85% of List Pages      │
│ 6. Search & Filters Bar                       │ <CRMToolbar />                   │ 100% of List Pages     │
│ 7. Entity CRUD Modal                          │ <FormModal /> + Form component   │ 100% of Forms          │
│ 8. In-Module Contextual Settings              │ <ContextualSettingsDrawer />     │ 100% of Customizations │
│ 9. Empty State Presentations                  │ <EmptyState module="..." />      │ 90% of Module Pages    │
│ 10. Table Row & Cell Sizing                   │ 64px (h-16) body, 44px (h-11) th │ 85% of Tables          │
│ 11. Pagination Bar                            │ <CRMPagination />                │ 80% of Tables          │
│ 12. Floating Topbar                           │ <Topbar /> with 58px card        │ 100% of CRM Pages      │
└───────────────────────────────────────────────┴──────────────────────────────────┴────────────────────────┘
```

---

## 2. Deep Canonical Pattern Breakdown

### Pattern 1: Page Header Pattern
- **Component:** [`web/shared/components/crm/CRMPageHeader.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMPageHeader.tsx)
- **Appearance:** Appears at the very top of every main module screen.
- **Styling Characteristics:**
  - Icon pill container: `.crm-icon-box` (`size-9 rounded-lg border border-border bg-background shadow-xs`).
  - Badge tag: `px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-primary/20 bg-primary/10 text-primary`.
  - Title: `.crm-page-title` (`text-xl font-bold tracking-tight text-foreground sm:text-2xl`).
  - Subtitle: `.crm-description` (`text-xs sm:text-sm font-normal text-muted-foreground`).
  - Actions Row: Right-aligned horizontal flex group with `gap-2 sm:gap-2.5`, primary action on far right.

---

### Pattern 2: Primary & Secondary CTA Buttons
- **Component:** [`web/shared/ui/button.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/ui/button.tsx)
- **Primary CTA:**
  - Height: `h-9` (36px) or `h-10` (40px)
  - Styling: `border border-primary/20 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:brightness-110 active:scale-[0.98]`
  - Micro-Interaction: Embedded animated icon trigger on mouse enter/leave.
- **Secondary CTA:**
  - Height: `h-9` (36px) or `h-10` (40px)
  - Styling: `border border-border bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-muted active:scale-[0.98]`

---

### Pattern 3: KPI Metric Cards Pattern
- **Component:** [`web/shared/components/crm/CRMMetricCard.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMMetricCard.tsx)
- **Appearance:** Displayed in a 3 or 4 column grid directly below page headers.
- **Styling Characteristics:**
  - Card Surface: Pastel gradient background with subtle border (`border-[#B2E8CB]`, `border-[#D4B5FC]`, etc.) + `rounded-2xl p-4 sm:p-5`.
  - Halftone dot matrix pattern in bottom-left corner (`opacity-[0.14]`).
  - Top Row: Layered 3D icon badge on left (frosted backdrop + solid front pill) + Trend badge on right (`ArrowUpRight` + percentage).
  - Bottom Row: Deep-contrast title (`text-xs font-semibold`) + Large bold hero value (`text-2xl sm:text-3xl font-extrabold tabular-nums`) + Smooth cubic bezier sparkline wave.

---

### Pattern 4: Two-Stage Scroll Table Workspace Pattern
- **Component:** `.crm-table-workspace-sticky` & `.crm-table-wrap` ([`web/app/globals.css:628-663`](file:///d:/Projects/project/clixprocrm/web/app/globals.css#L628-L663))
- **Appearance:** Primary data record view across all CRUD modules.
- **Styling Characteristics:**
  - Stage 1: User scrolls page down; header and KPI cards move out of view.
  - Stage 2: Sticky container docks directly below Topbar (`top: 0`, bounded by `max-height: calc(100dvh - var(--sa-header-h, 84px))`).
  - Inner table container (`.crm-table-wrap`) becomes the scroll owner for infinite data scrolling.
  - Table Head: `sticky top-0 z-20 bg-card border-b border-border/60 text-[12px] font-semibold uppercase tracking-[0.05em] h-10 sm:h-11`.
  - Table Rows: `h-16 border-b border-border/40 hover:bg-muted/[0.03] transition-colors cursor-pointer`.

---

### Pattern 5: Integrated Toolbar & View Toggle
- **Component:** [`web/shared/components/crm/CRMToolbar.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMToolbar.tsx)
- **Styling Characteristics:**
  - Surface: `bg-card p-3 rounded-xl border border-border shadow-card flex flex-col sm:flex-row items-center justify-between gap-3`.
  - Search Input: Left-aligned with search icon + instant clear `X` button (`border-transparent bg-muted/40 pl-9`).
  - Filter Pills: Horizontal button group (`All`, `Leads`, `Customers`, `Active`, etc.) using `variant={active ? "secondary" : "ghost"}` (`h-8 px-3 text-xs font-semibold`).
  - View Toggle: Segmented switcher for `List`, `Grid`, `Pipeline`, `Calendar`, `Timeline`.

---

### Pattern 6: In-Module Contextual Settings Drawer
- **Component:** [`web/shared/components/crm/ContextualSettingsDrawer.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/ContextualSettingsDrawer.tsx)
- **Appearance:** Triggered by `"Customize"` action in page header.
- **Styling Characteristics:**
  - Right slide-over sheet (`lg:max-w-4xl` / `xl:max-w-5xl`).
  - Left navigation rail with active section pills (`bg-primary/10 border border-primary/20 text-primary`).
  - Right scrollable content panel (`custom-scrollbar`).
  - Sticky bottom save bar with `"Auto-synced"` indicator, `"Close"`, `"Save Changes"` buttons, and unsaved changes discard alert modal.

---

### Pattern 7: Module Empty State Pattern
- **Component:** [`web/shared/components/EmptyState.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/EmptyState.tsx)
- **Styling Characteristics:**
  - Container: `rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-8 sm:p-12`.
  - Ambient radial gradient glow in background (`from-primary/15 via-primary/5 to-transparent blur-3xl`).
  - Icon pill: Centered 56px (`w-14 h-14`) rounded-2xl icon pill with soft shadow.
  - Typography: Centered `text-lg sm:text-xl font-bold` title + `text-xs sm:text-sm text-muted-foreground` description.
  - Action buttons: Centered primary (`Button variant="default"`) and secondary (`Button variant="outline"`) action buttons.
