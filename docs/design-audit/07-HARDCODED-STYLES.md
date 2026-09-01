# CRM Design System Audit — Hardcoded Styles & Tokens Analysis

> **Audit Date:** September 2026  
> **Repository:** `clixprocrm`  
> **Rule:** Objective extraction of repeated hardcoded values (colors, dimensions, radii, durations) that should be considered for centralized tokenization.

---

## 1. Hardcoded Color Values

### 1.1 App Shell Base Neutral Fills
| Hex / OKLCH Value | CSS Rule / Context | Occurrences / Files | Recommended Token Candidate |
| :--- | :--- | :--- | :--- |
| `#fafafa` | `bg-[#fafafa]` (Light surface undertone) | [`DashboardShell.tsx:28`](file:///d:/Projects/project/clixprocrm/web/features/dashboard/components/DashboardShell.tsx#L28), [`SuperAdminLayout.tsx:60`](file:///d:/Projects/project/clixprocrm/web/app/(super-admin)/layout.tsx#L60) | `--color-surface-subtle` |
| `#050505` | `dark:bg-[#050505]` (Dark surface undertone) | [`DashboardShell.tsx:28`](file:///d:/Projects/project/clixprocrm/web/features/dashboard/components/DashboardShell.tsx#L28), [`SuperAdminLayout.tsx:60`](file:///d:/Projects/project/clixprocrm/web/app/(super-admin)/layout.tsx#L60) | `--color-surface-subtle-dark` |

---

### 1.2 Enterprise Metric Card 3D Pastel Palette
In [`CRMMetricCard.tsx:46-187`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMMetricCard.tsx#L46-L187), the following rich pastel gradients are currently declared as hardcoded inline hex values:

| Theme Key | Background Gradient Range | Border Hex | Sparkline / Accent Hex | Title / Value Dark Contrasts |
| :--- | :--- | :--- | :--- | :--- |
| **Emerald** | `#D8F5E5` → `#E2F8EC` → `#C9F2DC` | `#B2E8CB` | `#00A76F` (Stroke) / `#7BE3A8` (Backdrop) | Title: `#0B4628`, Value: `#004B50` |
| **Violet / Purple** | `#EAD9FF` → `#F1E6FF` → `#E1CAFE` | `#D4B5FC` | `#8E33FF` (Stroke) / `#C495FD` (Backdrop) | Title: `#3B1475`, Value: `#300D61` |
| **Orange / Amber** | `#FFF1C2` → `#FFF6D6` → `#FFE7A0` | `#FCE08F` | `#B76E00` (Stroke) / `#FFD666` (Backdrop) | Title: `#7A4F01`, Value: `#5C3B00` |
| **Pink / Rose** | `#FFE3D9` → `#FFECE5` → `#FFD4C5` | `#FCBEAC` | `#B71D18` (Stroke) / `#FFA48D` (Backdrop) | Title: `#7A0916`, Value: `#5B0410` |
| **Cyan** | `#D0F2FE` → `#E0F6FE` → `#BEECFC` | `#A1E4FA` | `#007B8C` (Stroke) / `#70D7F9` (Backdrop) | Title: `#044463`, Value: `#003750` |
| **Indigo / Blue** | `#E0E7FF` → `#EBF0FE` → `#D3DCFE` | `#C2D0FC` | `#4F46E5` (Stroke) / `#A5B4FC` (Backdrop) | Title: `#1E2E6B`, Value: `#1A237E` |
| **Slate** | `#E2E8F0` → `#EDF2F7` → `#CBD5E1` | `border-slate-300` | `#64748B` (Stroke) / `bg-slate-300` | Title: `text-slate-700`, Value: `text-slate-900` |

---

### 1.3 Auth Viewport Atmospheric Gradients
In [`globals.css:1358-1437`](file:///d:/Projects/project/clixprocrm/web/app/globals.css#L1358-L1437), multi-stop radial and linear gradients are defined inline:
- Base gradient: `linear-gradient(155deg, oklch(0.20 0.07 168) 0%, oklch(0.13 0.05 190) 40%, oklch(0.08 0.025 240) 100%)`
- Ambient blobs: `oklch(0.60 0.20 157 / 0.35)`, `oklch(0.52 0.18 240 / 0.28)`, `oklch(0.68 0.18 160 / 0.2)`

---

## 2. Hardcoded Dimensions & Sizing Values

| Dimension Value | Where Used in Codebase | Purpose / Context |
| :--- | :--- | :--- |
| **`270px`** | [`DashboardShell.tsx:38`](file:///d:/Projects/project/clixprocrm/web/features/dashboard/components/DashboardShell.tsx#L38), [`sidebar.tsx:66`](file:///d:/Projects/project/clixprocrm/web/features/dashboard/components/sidebar.tsx#L66), [`BaseSidebar.tsx:126`](file:///d:/Projects/project/clixprocrm/web/shared/components/sidebar/BaseSidebar.tsx#L126) | Expanded desktop sidebar width |
| **`86px`** | [`DashboardShell.tsx:38`](file:///d:/Projects/project/clixprocrm/web/features/dashboard/components/DashboardShell.tsx#L38), [`BaseSidebar.tsx:126`](file:///d:/Projects/project/clixprocrm/web/shared/components/sidebar/BaseSidebar.tsx#L126) | Collapsed desktop icon rail width |
| **`58px`** | [`topbar.tsx:56`](file:///d:/Projects/project/clixprocrm/web/features/dashboard/components/topbar.tsx#L56) | Topbar floating card height (`h-[58px]`) |
| **`64px` (`h-16`)** | [`CRMDataTable.tsx:18,20`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMDataTable.tsx#L18), [`table.tsx:89`](file:///d:/Projects/project/clixprocrm/web/shared/ui/table.tsx#L89) | Standard data table data row height |
| **`44px` (`h-11`)** | [`CRMDataTable.tsx:21`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMDataTable.tsx#L21), [`table.tsx:76`](file:///d:/Projects/project/clixprocrm/web/shared/ui/table.tsx#L76) | Standard data table column header height |
| **`34px` (`h-8.5`)** | [`ContextualSettingsDrawer.tsx:231,243`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/ContextualSettingsDrawer.tsx#L231) | Non-standard button height in drawer save bar |
| **`28px` (`h-7 w-7`)** | [`invoices/page.tsx:476`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/invoices/page.tsx#L476) | Table row action trigger icon button |
| **`350px`** | [`dashboard/page.tsx:45,92`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/dashboard/page.tsx#L45), [`reports/page.tsx:281,284`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/reports/page.tsx#L281) | Fixed height for charts and dashboard cards |
| **`220px`** | [`invoices/page.tsx:426`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/invoices/page.tsx#L426), [`employees/page.tsx:291`](file:///d:/Projects/project/clixprocrm/web/app/(dashboard)/employees/page.tsx#L291) | Truncated client / company text width limit in tables |

---

## 3. Hardcoded Transition & Easing Classes

| Transition / Easing String | Where Used in Codebase | Recommended Token |
| :--- | :--- | :--- |
| `ease-[cubic-bezier(0.16,1,0.3,1)]` | [`button.tsx:8`](file:///d:/Projects/project/clixprocrm/web/shared/ui/button.tsx#L8), [`sheet.tsx:65`](file:///d:/Projects/project/clixprocrm/web/shared/ui/sheet.tsx#L65), [`globals.css:1647`](file:///d:/Projects/project/clixprocrm/web/app/globals.css#L1647) | `motionTokens.easing.easeOut` |
| `cubic-bezier(0.4, 0, 0.2, 1)` | [`DashboardShell.tsx:40`](file:///d:/Projects/project/clixprocrm/web/features/dashboard/components/DashboardShell.tsx#L40), [`globals.css:881`](file:///d:/Projects/project/clixprocrm/web/app/globals.css#L881) | `motionTokens.easing.easeInOut` |
| `[0.25, 0.46, 0.45, 0.94]` | [`CRMMetricCard.tsx:383`](file:///d:/Projects/project/clixprocrm/web/shared/components/crm/CRMMetricCard.tsx#L383) | `transitions.normal` |
