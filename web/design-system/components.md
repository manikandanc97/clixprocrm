# Canonical Component Architecture — ClixProCRM

This document defines the canonical component system for ClixProCRM. Every UI element in the platform must utilize these designated canonical components instead of ad-hoc HTML or unstandardized wrappers.

---

## 1. Canonical Component Index

| Canonical Component | Primitive / Source | Primary Role |
| :--- | :--- | :--- |
| **`CRMButton`** | Radix Slot / `shared/ui/button.tsx` | All buttons, triggers, icon-buttons |
| **`CRMInput`** | Radix / `shared/ui/input.tsx` | Single-line text, email, search fields |
| **`CRMSelect`** | Radix Select / `shared/ui/select.tsx` | Single & multi-select drop-downs |
| **`CRMTextarea`** | Radix / `shared/ui/textarea.tsx` | Multi-line text, comments, notes |
| **`CRMCard`** | `shared/components/crm/CRMCard.tsx` | Standard modular cards & widget containers |
| **`CRMDialog`** | Radix Dialog / `shared/ui/dialog.tsx` | Accessible modal dialogs |
| **`CRMDrawer`** | Radix Sheet / `shared/ui/sheet.tsx` | Slide-over drawers & inspector panels |
| **`CRMTable`** | Radix / `shared/ui/table.tsx` | Base HTML table primitive |
| **`CRMDataTable`** | `shared/components/crm/CRMDataTable.tsx`| Full declarative data table with sort & selection |
| **`CRMBadge`** | `shared/ui/badge.tsx` | Status tags, role badges, entity flags |
| **`CRMAvatar`** | Radix Avatar / `shared/ui/avatar.tsx` | User & company profile avatars |
| **`CRMTabs`** | Radix Tabs / `shared/ui/tabs.tsx` | Tabbed navigation & view toggles |
| **`CRMTooltip`** | Radix Tooltip / `shared/ui/tooltip.tsx` | Helper tips and icon descriptions |
| **`CRMAlert`** | `shared/components/crm/CRMAlert.tsx` | Warning & emergency banners |
| **`CRMToast`** | Sonner (`toast`) | Transient feedback notifications |
| **`CRMSkeleton`** | `shared/components/skeletons/` | Loading state placeholders |
| **`CRMEmptyState`** | `shared/components/EmptyState.tsx` | Zero-data states with contextual CTAs |
| **`CRMErrorState`** | `shared/components/crm/PageFeedbackStates.tsx` | Error fallback cards with retry actions |
| **`CRMPageHeader`**| `shared/components/crm/CRMPageHeader.tsx` | Standardized page title, breadcrumb & action bar |
| **`CRMToolbar`** | `shared/components/crm/CRMToolbar.tsx` | Search, filter chips, bulk actions & view modes |
| **`CRMStatCard`** | `shared/components/crm/CRMMetricCard.tsx` | KPI metrics, telemetry trends & sparklines |
| **`CRMPagination`**| `shared/components/crm/CRMPagination.tsx` | Record counts, page buttons & per-page selects |

---

## 2. Component Specifications

### 2.1 `CRMButton`
- **Variants**: `default` (Primary Emerald), `secondary`, `outline`, `ghost`, `destructive`, `link`.
- **Sizes**:
  - `xs`: `h-7 px-2 text-xs` (Inline table action)
  - `sm`: `h-8 px-3 text-xs` (Header secondary actions, toolbar buttons)
  - `default`: `h-9 px-3.5 text-xs font-semibold` (Primary page CTA, form submits)
  - `lg`: `h-10 px-4 text-sm` (Onboarding, billing upgrade CTA)
  - `icon`: `size-9 rounded-md`

### 2.2 `CRMDialog` & `FormModal`
- **Backdrop**: `bg-black/40 backdrop-blur-xs` (standardized across all light/dark themes).
- **Surface**: `bg-popover border border-border shadow-elevated rounded-xl`.
- **Padding**: Header `p-6 pb-2`, Body `p-6 py-4`, Footer `p-4 sm:px-6 bg-muted/20 border-t border-border`.
- **Keyboard & A11y**: Full ESC key support, focus trap, VisuallyHidden title fallback.

### 2.3 `CRMDataTable`
- **Container**: `crm-card p-0 overflow-hidden flex flex-col flex-1 min-h-0`.
- **Header**: Sticky `top-0 z-20 bg-muted/60 dark:bg-muted/40 border-b border-border text-xs font-bold`.
- **Row Height**: `h-14 sm:h-16 border-b border-border/40 hover:bg-muted/30`.
- **Empty & Loading**: Automatically renders canonical `EmptyState` and `TableSkeleton`.

### 2.4 `CRMBadge`
- **Variants**: `default` (primary), `secondary`, `success`, `warning`, `destructive`, `info`, `neutral`.
- **Typography**: `text-[10px] font-bold uppercase tracking-wider`.
- **Shape**: Standardized `rounded-full` with subtle semantic border (`border-<status>/25`).

---

## 3. Anti-Patterns & Prohibitions

❌ **DO NOT USE**:
- Hand-rolled HTML elements (`<button className="...">`, `<input className="...">`) where canonical components exist.
- Parallel modal components: Do not write `fixed inset-0 z-50 flex items-center justify-center bg-black/60`.
- Duplicate button components like `CustomDeleteButton` or `ActionSubmitBtn`.
- Ad-hoc badge styling with arbitrary color classes (`bg-[#ffedd5] text-[#9a3412]`). Use `<CRMBadge variant="warning">`.
