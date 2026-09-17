# Layout & Shell System — ClixProCRM

The Layout System defines the responsive scaffolding of the ClixProCRM application, including the root application shells, navigation bars, page containers, data tables, and two-stage scrolling behavior.

---

## 1. Application Shell Hierarchy

```
Root Layout (HTML / Providers)
  └── DashboardShell / SuperAdminLayout
        ├── Sidebar (Collapsible, fixed left, top-3.5 left-3.5)
        └── Main Content Area (flex-1 flex flex-col min-h-0 w-full)
              ├── Topbar (Fixed 58px header with search, notifications, user profile)
              └── Viewport Content (w-full min-h-0 relative flex-1)
                    └── CRMPageContainer (Canonical padding & vertical rhythm)
```

---

## 2. Shell Specifications

### 2.1 Fixed Heights & Offsets
- **Topbar Height**: `58px` (`h-[58px]`).
- **Sidebar Width (Expanded)**: `260px` (`w-[260px]`).
- **Sidebar Width (Collapsed)**: `72px` (`w-[72px]`).
- **Sidebar Inset**: `14px` (`top-3.5 left-3.5`).
- **Content Max Width**: `1600px` (`max-w-7xl` or `max-w-[1600px]` depending on module density).

### 2.2 Canonical Page Shell (`CRMPageContainer`)
```tsx
<CRMPageContainer twoStageScroll={true}>
  <CRMPageHeader ... />
  <CRMStatGrid ... /> {/* If analytical route */}
  <CRMDataTable ... />
</CRMPageContainer>
```

---

## 3. Two-Stage Scroll Architecture

ClixProCRM features an enterprise two-stage scroll pattern for data-dense routes (Contacts, Leads, Companies, Tasks, Users, Invoices):

1. **Stage 1 (Page Scroll)**: When scrolling starts, the entire page scrolls naturally, moving through the Header and KPI cards.
2. **Stage 2 (Sticky Table Docking)**: When the table toolbar reaches the bottom of the Topbar, it docks seamlessly (`sticky top-0 z-20`). The table body becomes an independent, bounded scroll container.
3. **Viewport Lock Prevention**: Outer layout containers must always declare `min-h-0` to allow child scroll wrappers to calculate their heights properly without creating double scrollbars.

---

## 4. Grid System & Responsive Breakpoints

| Breakpoint | Minimum Width | Typical Device Target | Grid Columns Default |
| :--- | :--- | :--- | :--- |
| `xs` / Mobile | `< 640px` | Phones (Portrait) | 1 column |
| `sm` | `640px` | Phones (Landscape) | 1–2 columns |
| `md` | `768px` | Tablets | 2 columns |
| `lg` | `1024px` | Small Laptops | 3 columns (KPIs) |
| `xl` | `1280px` | Desktop Screens | 4 columns (KPIs) |
| `2xl`| `1536px` | High-Resolution Monitors | 4–6 columns |

---

## 5. Anti-Patterns & Prohibitions

❌ **DO NOT USE**:
- Nested full-page scroll containers (`overflow-y-scroll` inside an already scrolling shell).
- Hardcoded height calculations in JSX: `h-[calc(100vh-200px)]`. Use flexbox stretch (`flex-1 min-h-0`).
- Direct manipulation of global body overflow (`document.body.style.overflow = 'hidden'`) outside of Radix dialog portal managers.
- Unconstrained wide tables without horizontal scroll containers. All tables must be enclosed in `overflow-x-auto min-h-0`.
