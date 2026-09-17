# ClixProCRM Design System — Core Architecture & Guide

Welcome to the canonical design system for **ClixProCRM**.

This design system establishes **one visual language** across every page, module, component, modal, table, form, dashboard, and administrative surface across the platform.

---

## 1. Core Philosophy

```
INSPIRATION
    ↓
DESIGN DECISIONS
    ↓
CLIXPRO DESIGN SYSTEM (Single Source of Truth)
    ↓
CANONICAL SHARED COMPONENTS
    ↓
ALL UI SCREENS
```

- **Single Source of Truth**: Inspiration is an informative reference, never an ad-hoc implementation source. All visual decisions are canonized in design tokens.
- **Predictability Over Novelty**: Screens should look and behave as if designed by one craft-driven designer and built by one engineer.
- **Enterprise Calm**: Clean contrast, deliberate visual grouping, mathematical rhythm, and restrained density without clutter or jarring neon accents.
- **Semantic First**: No raw hex codes, ad-hoc pixel values, or manual backdrop layers inside application code.

---

## 2. Directory Hierarchy

```
web/design-system/
├── README.md          # System overview, philosophy & architectural principles
├── tokens.md          # Canonical token catalog, CSS variables & @theme bindings
├── colors.md          # Semantic color palette, contrast standards & accent engine
├── typography.md      # Font hierarchy, type scale, leading & tracking rules
├── spacing.md         # 4-point spacing scale, margins, paddings & rhythm
├── layout.md          # Viewport shell, containers, cards, grids & toolbars
├── components.md      # Canonical component specifications & API contracts
├── states.md          # Interactive, feedback, empty, loading & error states
├── motion.md          # Durations, easings, transitions & reduced-motion rules
└── responsive.md      # Breakpoints, fluid adaptations & mobile view patterns
```

---

## 3. Technology Stack Integration

The ClixProCRM design system integrates natively with:
- **Tailwind CSS v4** (`@import "tailwindcss"; @theme inline { ... }`)
- **Next.js 16** (App Router & Server Components)
- **Radix UI Primitives** (Unstyled accessible primitives)
- **OKLCH Color Space** (Perceptually uniform contrast, dynamic theme accents)
- **Lucide Icons** (Standardized icon weights, bounding boxes, and alignments)

---

## 4. Design System Commandments

1. **Never use arbitrary Tailwind classes** like `bg-[#0f172a]`, `text-[#059669]`, or `rounded-[22px]`. Always use semantic design tokens (`bg-card`, `text-primary`, `rounded-xl`).
2. **Never create custom hand-rolled modals**. Always use canonical `CRMDialog` or `FormModal`.
3. **Never hand-roll tables with raw HTML**. Always use canonical `CRMDataTable` or `CRMTable`.
4. **Never create page-specific variations of standard controls**. Use the standard size variants of canonical components.
5. **Always respect accessibility and motion preferences** (`prefers-reduced-motion: reduce`).
