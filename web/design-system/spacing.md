# Spacing System — ClixProCRM

The ClixProCRM Spacing System is anchored to an uncompromising **4-point spatial scale** (`0.25rem = 4px`). It governs all page containers, card paddings, grid gutters, table heights, and modal dialogs across the platform.

---

## 1. Canonical Spacing Scale

Every layout dimension maps directly to standard Tailwind spacing multiples:

| Token | Class | Value | Primary Application |
| :--- | :--- | :--- | :--- |
| `space-1` | `p-1`, `gap-1` | `4px` (`0.25rem`) | Segment controls, icon padding, micro gaps |
| `space-1.5` | `p-1.5`, `gap-1.5` | `6px` (`0.375rem`) | Badge interior, breadcrumb separator spacing |
| `space-2` | `p-2`, `gap-2` | `8px` (`0.50rem`) | Toolbar element spacing, button gaps |
| `space-2.5` | `p-2.5`, `gap-2.5` | `10px` (`0.625rem`) | Header badges, search bar input gaps |
| `space-3` | `p-3`, `gap-3` | `12px` (`0.75rem`) | Compact card padding, toolbar interior |
| `space-3.5` | `p-3.5`, `gap-3.5` | `14px` (`0.875rem`) | Standard toolbar padding, table cell padding |
| `space-4` | `p-4`, `gap-4` | `16px` (`1.0rem`) | Comfortable card padding, mobile lateral margin |
| `space-5` | `p-5`, `gap-5` | `20px` (`1.25rem`) | Standard card padding, grid vertical rhythm |
| `space-6` | `p-6`, `gap-6` | `24px` (`1.5rem`) | Desktop lateral page margin, modal padding |
| `space-8` | `p-8`, `gap-8` | `32px` (`2.0rem`) | Page bottom margin (`pb-8`), large section gap |
| `space-12` | `p-12`, `gap-12` | `48px` (`3.0rem`) | Auth screen padding, marketing container padding |

---

## 2. Page-Level Spacing Rules

All page shells and views must conform to the **Single Source of Truth** established in `CRMPageContainer`:

```tsx
<CRMPageContainer>
  {/* mx-auto w-full flex flex-col gap-4 sm:gap-5 px-4 sm:px-6 pt-1 pb-6 sm:pb-8 relative */}
</CRMPageContainer>
```

### Breakdown:
- **Lateral Breathing Room**: `px-4 sm:px-6` (16px on mobile, 24px on desktop).
- **Top Alignment**: `pt-1` (4px). Aligns page header cleanly under the fixed Topbar without excess white gap.
- **Vertical Flow Rhythm**: `gap-4 sm:gap-5` (16px mobile, 20px desktop) between PageHeader, KPI cards, and Data Tables.
- **Bottom Terminal Spacing**: `pb-6 sm:pb-8` (24px mobile, 32px desktop). Guarantees content never collides with viewport bottom.

---

## 3. Card & Module Padding Matrix

| Module Type | Inner Padding | Canonical Classes |
| :--- | :--- | :--- |
| **Toolbar / Filter Bar** | `12px` / `14px` | `p-3 sm:p-3.5` |
| **Standard CRM Card** | `16px` / `20px` | `p-4 sm:p-5` |
| **KPI / Metric Stat Card** | `16px` / `20px` | `p-4 sm:p-5` |
| **Table Container** | `0px` (flush edges) | `p-0` |
| **Modal / Dialog Body** | `20px` / `24px` | `p-5 sm:p-6` |
| **Side Drawer Content** | `20px` / `24px` | `p-5 sm:p-6` |

---

## 4. Anti-Patterns & Prohibitions

❌ **DO NOT USE**:
- Arbitrary bottom padding: `pb-10`, `pb-12`, `pb-16` inside individual pages. The `CRMPageContainer` already manages terminal padding.
- Hardcoded margin tops (`mt-6`, `mt-8`, `mt-12`) that fight the container's `flex flex-col gap-4 sm:gap-5`.
- Mixed card paddings (`p-7`, `p-9`, `p-[18px]`). Always stick to `p-4 sm:p-5`.
- Floating pagination detached with `mt-auto`. Pagination must be anchored directly to table cards.
