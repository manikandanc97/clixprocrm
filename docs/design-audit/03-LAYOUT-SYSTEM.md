# CRM Design System Audit — Layout System Audit

> **Audit Date:** September 2026  
> **Repository:** `clixprocrm`  
> **Source Files Inspected:**  
> - [`web/features/dashboard/components/DashboardShell.tsx`](file:///d:/Projects/project/clixprocrm/web/features/dashboard/components/DashboardShell.tsx)  
> - [`web/features/dashboard/components/topbar.tsx`](file:///d:/Projects/project/clixprocrm/web/features/dashboard/components/topbar.tsx)  
> - [`web/features/dashboard/components/sidebar.tsx`](file:///d:/Projects/project/clixprocrm/web/features/dashboard/components/sidebar.tsx)  
> - [`web/shared/components/sidebar/BaseSidebar.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/sidebar/BaseSidebar.tsx)  
> - [`web/shared/components/crm/CRMPageContainer.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMPageContainer.tsx)  
> - [`web/app/globals.css`](file:///d:/Projects/project/clixprocrm/web/app/globals.css)  
> - [`web/app/(super-admin)/layout.tsx`](file:///d:/Projects/project/clixprocrm/web/app/(super-admin)/layout.tsx)  
> - [`web/features/auth/components/auth-layout.tsx`](file:///d:/Projects/project/clixprocrm/web/features/auth/components/auth-layout.tsx)  

---

## 1. Application Shell Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DashboardShell (100dvh / h-screen, overflow: hidden)                        │
│ ┌────────────────────────┬────────────────────────────────────────────────┐ │
│ │                        │ Topbar (h-[58px] floating card, px-4 sm:px-6)  │ │
│ │                        ├────────────────────────────────────────────────┤ │
│ │ Sidebar (Fixed Outside)│ <main> Scrollable Viewport (overflow-y: auto)   │ │
│ │ Expanded:  270px       │ ┌────────────────────────────────────────────┐ │ │
│ │ Collapsed: 86px        │ │ CRMPageContainer                           │ │ │
│ │ Mobile:    Sheet Drawer│ │   - CRMPageHeader                          │ │ │
│ │                        │ │   - CRMMetricsGrid (KPI Cards)             │ │ │
│ │                        │ │   - .crm-table-workspace-sticky           │ │ │
│ │                        │ │       - CRMToolbar (Search/Filters)        │ │ │
│ │                        │ │       - .crm-table-wrap (Overflow Table)   │ │ │
│ │                        │ │       - CRMPagination                      │ │ │
│ │                        │ └────────────────────────────────────────────┘ │ │
│ └────────────────────────┴────────────────────────────────────────────────┘ │
│ MobileBottomNav (Fixed bottom on md:hidden mobile viewports)                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Layout Rules

### 2.1 Sidebar (`<Sidebar />` & `<BaseSidebar />`)
- **Positioning:** Desktop sidebar is fixed (`position: fixed; top: 0; bottom: 0; left: 0`), rendering outside DOM content flow.
- **Dynamic Content Offset:** `<DashboardShell>` uses Framer Motion on the main content container:
  ```typescript
  animate={{
    paddingLeft: mounted && isDesktop ? (isCollapsed ? "86px" : "270px") : "0px",
  }}
  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
  ```
- **Internal Structure:** Header (Logo + Workspace Title + Plan Badge) -> Scrollable Grouped Menu Links -> Bottom Footer (Support + Upgrade Link).
- **Scroll Behavior:** Uses `.sidebar-scroll` with auto-hiding scrollbar: scrollbars remain completely transparent until hover or scrolling begins, then smoothly fade out.

### 2.2 Topbar (`<Topbar />`)
- **Container Structure:** Outer wrapper (`px-4 sm:px-6 pt-3.5 pb-2.5 sm:pb-3 shrink-0`) containing a single floating card (`h-[58px] rounded-2xl bg-sidebar border border-sidebar-border shadow-none px-3.5 sm:px-5`).
- **Dynamic Measurement Hook:** Topbar attaches a `ResizeObserver` on its header element and injects `--sa-header-h` into the `:root` style attribute:
  ```typescript
  const h = headerRef.current?.offsetHeight ?? 0;
  document.documentElement.style.setProperty("--sa-header-h", `${h}px`);
  ```
  This guarantees pixel-perfect sticky alignment for table workspaces.

### 2.3 Main Content Container (`<CRMPageContainer />`)
Defined in [`web/shared/components/crm/CRMPageContainer.tsx`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMPageContainer.tsx):
- **Default Mode:** Applies `flex-1 min-h-0 flex flex-col gap-4 sm:gap-5 px-4 sm:px-6 pt-1 pb-3.5` with Framer Motion entry animation (`{ opacity: 0, y: 10 }`).
- **`twoStageScroll` Mode:** Replaces Framer Motion with a plain div (`animate-in fade-in duration-300`). **Crucial design decision:** Framer Motion CSS transforms on parent containers create a new stacking context that breaks browser `position: sticky` on child elements. `twoStageScroll={true}` removes the CSS transform to enable the two-stage scroll pattern.

---

## 3. Two-Stage Scroll Pattern Mechanics

The CRM uses a specialized enterprise two-stage scrolling architecture across all primary list modules (**Contacts, Deals, Companies, Invoices, Quotations, Tasks, Employees**):

```
Stage 1: Outer Page Scroll
┌──────────────────────────────────────────────┐
│ Page Header                                  │
│ CRMMetricsGrid (KPI Cards)                   │  ▲ User scrolls down:
├──────────────────────────────────────────────┤  │ Metric cards scroll up & away
│ .crm-table-workspace-sticky (Reaches Topbar) │  │
└──────────────────────────────────────────────┘

Stage 2: Sticky Workspace & Inner Table Body Scroll
┌──────────────────────────────────────────────┐
│ Topbar (Fixed Header: --sa-header-h)        │
├──────────────────────────────────────────────┤
│ .crm-table-workspace-sticky (position: sticky; top: 0; max-h: calc(100dvh - var(--sa-header-h)))
│ ┌──────────────────────────────────────────┐ │
│ │ CRMToolbar (Search & Filter Pills)       │ │  ▲ Outer scroll stops.
│ ├──────────────────────────────────────────┤ │  │ Inner table body now scrolls
│ │ .crm-table-wrap (flex-1 overflow-auto)   │ │  │ infinitely with sticky table headers!
│ │   - Sticky Table Header (thead: bg-card) │ │  │
│ │   - 64px Data Rows (tbody)               │ │  │
│ ├──────────────────────────────────────────┤ │
│ │ CRMPagination                            │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Exact CSS Implementation ([`web/app/globals.css:628-663`](file:///d:/Projects/project/clixprocrm/web/app/globals.css#L628-L663)):
```css
.crm-table-workspace-sticky {
  position: sticky;
  top: 0;
  max-height: calc(100dvh - var(--sa-header-h, 84px));
  height: auto;
  display: flex;
  flex-direction: column;
  gap: 0.875rem; /* gap-3.5 */
  width: 100%;
  z-index: 10;
  background-color: var(--background);
  padding-top: 0.75rem;
  padding-bottom: 0.875rem;
}

.crm-table-wrap,
.crm-table-container {
  overflow: hidden;
  border-radius: var(--radius-lg); /* 12px */
  border: 1px solid var(--border);
  background-color: var(--card);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  min-height: 0;
}
```

---

## 4. Scrollbar & Overflow Handling

- **Global Modern Thin Scrollbars:** Enforced globally on all webkit & Firefox browsers (`scrollbar-width: thin; scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track)`).
- **Themed Thumb:** Uses theme primary color with opacity (`color-mix(in srgb, var(--primary) 65%, transparent)` in light mode, `70%` in dark mode).
- **Auto-Hide Sidebar Scroll:** `.sidebar-scroll` hides scrollbar until hovered or actively scrolling.
- **Kanban & Horizontal Scroll:** `.kanban-board-scroll` configured for smooth touch & wheel panning across kanban stages.
- **Hidden Scrollbars:** `.no-scrollbar`, `.hide-scrollbar`, `.scrollbar-hide` for filter pill carousels.

---

## 5. Responsive Breakpoint Rules

| Breakpoint | Width | Layout Adaptations |
| :--- | :--- | :--- |
| **Mobile (`< 640px`)** | `< 640px` | - Sidebar hidden; accessible via Sheet drawer<br>- Mobile bottom nav fixed at bottom (`<MobileBottomNav />`)<br>- `<main>` applies `pb-20` to prevent bottom nav collision<br>- KPI grid stacks to 1 column (`grid-cols-1`)<br>- Tables scroll horizontally inside `.crm-table-wrap`<br>- Page header stacks vertically (`flex-col`) |
| **Tablet (`640px – 767px`)** | `640px – 767px` | - KPI grid becomes 2 columns (`sm:grid-cols-2`)<br>- Toolbar flexes horizontally (`sm:flex-row`)<br>- Header buttons align to right |
| **Desktop (`768px – 1023px`)** | `768px – 1023px` | - Desktop sidebar renders outside flow (`86px` collapsed or `270px` expanded)<br>- Mobile bottom nav is hidden (`md:hidden`)<br>- `<main>` removes `pb-20` (`md:pb-0`) |
| **Large Desktop (`≥ 1024px`)** | `≥ 1024px` | - KPI grids scale to 3 or 4 columns (`lg:grid-cols-3` / `lg:grid-cols-4`)<br>- Settings drawer opens at `lg:max-w-4xl`<br>- Operational 3:1 grids activate on Dashboard and Reports |
