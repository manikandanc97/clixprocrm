# Typography System — ClixProCRM

The ClixProCRM Typography System provides a clear, hierarchical, and accessible typographic scale. It ensures optimal legibility across high-density CRM tables, analytical dashboards, and administrative forms.

---

## 1. Font Family System

Typography is driven by three canonical font stacks declared in `globals.css`:

```css
--font-display: "Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif;
--font-sans:    "Segoe UI", "Helvetica Neue", "Arial Nova", sans-serif;
--font-mono:    "Cascadia Mono", "SFMono-Regular", "Consolas", monospace;
```

- **`font-display`**: Used strictly for page titles (`h1`, `h2`), auth headline displays, and KPI metric numbers.
- **`font-sans`**: Default workhorse for all body copy, form fields, table cells, buttons, toolbars, and badges.
- **`font-mono`**: Used for monetary values (`tabular-nums`), API keys, transaction IDs, hashes, and code blocks.

---

## 2. Canonical Type Scale

| Style Level | Class Name | Font Size | Line Height | Font Weight | Letter Spacing | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `crm-type-display` | `24px` sm:`30px` | `1.15` | `800` (Extrabold) | `-0.035em` | Auth heroes, marketing displays |
| **H1** | `crm-type-h1` | `18px` sm:`20px` | `1.25` | `700` (Bold) | `-0.025em` | Page header titles (`CRMPageHeader`) |
| **H2** | `crm-type-h2` | `16px` sm:`18px` | `1.30` | `700` (Bold) | `-0.02em` | Section headers, card group titles |
| **H3** | `crm-type-h3` | `14px` sm:`16px` | `1.35` | `600` (Semibold) | `-0.015em` | Card titles, modal headers, widget titles |
| **H4** | `crm-type-h4` | `13px` sm:`14px` | `1.40` | `600` (Semibold) | `-0.01em` | Sub-sections, list group headers |
| **Body** | `crm-type-body` | `14px` (`0.875rem`) | `1.50` | `400` / `500` | `0` | Form descriptions, modal body text |
| **Body Small** | `crm-type-body-sm` | `12px` (`0.75rem`) | `1.50` | `400` / `500` | `0` | Standard table cell data, subtitle text |
| **Label** | `crm-type-label` | `12px` (`0.75rem`) | `1.25` | `600` (Semibold) | `0` | Form field labels, input placeholders |
| **Caption** | `crm-type-caption` | `11px` (`0.6875rem`)| `1.40` | `400` (Regular) | `0` | Timestamp notes, metadata annotations |
| **Overline** | `crm-type-overline` | `10px` (`0.625rem`)| `1.20` | `700` (Bold) | `+0.05em` | Badges, status pills, table headers |

---

## 3. Data & Numerics Formatting

When displaying currency values, dates, counts, and metrics:
1. Always apply `.tabular-nums` (`font-variant-numeric: tabular-nums`).
2. This prevents layout jitter during real-time streaming, counter animations, or sorting.
3. Metric numbers in stat cards use `font-display text-2xl font-black tracking-tight tabular-nums`.

---

## 4. Anti-Patterns & Prohibitions

❌ **DO NOT USE**:
- Arbitrary inline font sizes: `text-[13px]`, `text-[15px]`, `text-[17px]`.
- Uncontrolled font weights: `font-black` on normal headings or `font-light` in table cells.
- Missing line-height classes on multi-line text (which defaults to browser default and breaks card height).
- Custom font families directly inside components via `style={{ fontFamily: ... }}`.
