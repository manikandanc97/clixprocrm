# Component States & Feedback System — ClixProCRM

ClixProCRM enforces an explicit, unified state machine for all interactive controls, data containers, tables, and full-page views.

---

## 1. Interactive Control States

Every interactive element (`CRMButton`, `CRMInput`, `CRMSelect`, `CRMCheckbox`, table row) must support the following canonical state transitions:

| State | Visual Treatment | CSS Classes / Tokens |
| :--- | :--- | :--- |
| **Resting** | Standard border and elevation | `border-border bg-card shadow-xs` |
| **Hover** | Subtle elevation increase, border accent glow | `hover:border-primary/40 hover:shadow-sm` |
| **Active / Pressed** | Micro scale down (2%), slight background darken | `active:scale-[0.98] active:bg-muted` |
| **Focus Visible** | 2px primary ring with 2px background offset | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |
| **Disabled** | 50% opacity, pointer events blocked, not-allowed cursor | `disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed` |
| **Invalid / Error**| Destructive border and focus ring | `aria-invalid:border-destructive aria-invalid:ring-destructive/20` |
| **Selected** | Primary 3% tint background with primary left accent | `data-[state=selected]:bg-primary/[0.04]` |

---

## 2. Container & Page States

### 2.1 Loading State (`PageLoadingState` & `TableSkeleton`)
- Avoid jarring blank screens or generic center-spinners for full pages.
- Standard pattern: **Structural Skeletons** matching the target layout (`PageHeaderSkeleton`, `ToolbarSkeleton`, `TableSkeleton`).
- Shimmer animation: Linear gradient sweeping `oklch(0.93)` to `oklch(0.96)` with 1.5s duration.
- Reduced Motion: In `prefers-reduced-motion: reduce`, animations are replaced with static muted fills.

### 2.2 Empty State (`CRMEmptyState`)
- Displayed when a collection or filter query returns 0 records.
- Standard anatomy:
  1. Icon enclosed in subtle ambient gradient pill.
  2. Clear heading (`crm-type-h3`): "No [Entity] Found".
  3. Helpful description (`crm-type-body-sm`): Explaining why it is empty or how to create one.
  4. Primary CTA Button: e.g. "Create Lead", "Import Data".
  5. Secondary action: "Reset Filters" if empty due to active filter query.

### 2.3 Error State (`CRMErrorState`)
- Displayed when an API query fails or network error occurs.
- Standard anatomy:
  1. Destructive icon (`AlertCircle`) inside a subtle rounded circle.
  2. Clear error title: "Failed to load records".
  3. Non-technical message explaining the issue.
  4. "Try Again" / "Retry" action button with `RefreshCw` icon.

---

## 3. Form Validation States

- Form fields must never display errors prematurely before initial blur (`onBlur`) or submission attempt.
- Validated state: Clean resting border.
- Invalid state:
  - Input border changes to `border-destructive`.
  - Focus ring becomes `focus-visible:ring-destructive/20`.
  - Error message renders below input in `text-destructive text-xs font-medium`.
  - Sub-pixel horizontal shake animation (3px max, 250ms).

---

## 4. Anti-Patterns & Prohibitions

❌ **DO NOT USE**:
- Blank empty screens with no guidance or call to action.
- Raw browser alert dialogs (`window.alert()`, `window.confirm()`).
- Indefinite loading spinners without timeout handling or error states.
- Missing focus rings on custom interactive components (which violates WCAG 2.1 AA keyboard accessibility).
