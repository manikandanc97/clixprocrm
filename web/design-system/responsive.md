# Responsive & Adaptive System — ClixProCRM

The ClixProCRM Responsive System ensures optimal usability across desktop monitors, laptops, tablets, and mobile devices without creating duplicate page architectures.

---

## 1. Breakpoint Grid

ClixProCRM utilizes standard Tailwind CSS breakpoints:

| Token | Min Width | Target Viewport | Navigation Layout | Content Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **`xs`** | `< 640px` | Phones (Portrait) | Collapsed bottom / sheet menu | 1 Column, full width, stacked toolbars |
| **`sm`** | `640px` | Phones (Landscape) | Mobile drawer menu | 1–2 Columns, horizontal toolbars |
| **`md`** | `768px` | Tablets | Compact fixed sidebar (72px) | 2 Columns, scrollable tables |
| **`lg`** | `1024px` | Small Laptops | Full fixed sidebar (260px) | 3 Columns, side-by-side forms |
| **`xl`** | `1280px` | High-Res Laptops | Full fixed sidebar (260px) | 4 Columns (KPIs), multi-pane views |
| **`2xl`**| `1536px` | Desktop Displays | Full fixed sidebar (260px) | Max container constraint (1600px) |

---

## 2. Adaptive Component Behaviors

### 2.1 Toolbars (`CRMToolbar`)
- **Desktop (`lg`+)**: Search input on left, filters in middle, bulk actions and view toggles right-aligned.
- **Mobile (`< sm`)**: Stacked vertical flow (`flex-col gap-3`). Search input expands to 100% width. Action buttons wrap naturally.

### 2.2 Tables (`CRMDataTable`)
- **Horizontal Scroll Protection**: Wrapped in `overflow-x-auto min-h-0`.
- **Minimum Width Guarantee**: Tables declare `min-w-[800px]` to `min-w-[1100px]` depending on column count.
- **Sticky Row Anchoring**: Checkbox and primary identifier remain visible during horizontal pan when required.

### 2.3 Modals vs Side Drawers
- **Small Screens (`< sm`)**: Modals expand to `w-[calc(100%-2rem)] max-w-lg`.
- **Complex Forms**: On mobile, complex forms render as bottom sheets or full-screen overlays (`max-h-[90vh]`) to ensure virtual keyboards do not obscure action buttons.

---

## 3. Touch Target Guidelines

- Minimum interactive touch target on mobile screens is **40px × 40px** (`h-10 w-10` or `p-2.5`) to conform with WCAG 2.1 Target Size criteria.
- Action menus and dropdown items have a minimum hit area of 36px on mobile.

---

## 4. Anti-Patterns & Prohibitions

❌ **DO NOT USE**:
- Complete desktop-only screens (`hidden sm:block` with no mobile alternative).
- Fixed width containers (`w-[1200px]`) that force horizontal page scroll.
- Hidden form action buttons that disappear below virtual mobile keyboards.
- Unconstrained tables that cause horizontal page blowout.
