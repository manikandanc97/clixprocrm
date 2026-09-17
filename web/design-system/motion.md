# Motion System — ClixProCRM

The ClixProCRM Motion System is designed for high-performance enterprise productivity: **fast, predictable, restrained, and calm**. 

Motion is used strictly to provide spatial awareness and direct manipulation feedback. It must never delay or distract from user workflows.

---

## 1. Core Motion Tokens

Centralized in `web/shared/lib/motion.ts`:

### 1.1 Durations
- **`micro` (100ms)**: Instant feedback (button press, checkbox toggle, hover scale).
- **`fast` (150ms)**: Tooltips, dropdown popovers, select menus.
- **`normal` (200ms)**: Modal dialogs, tab switching, slide-ins.
- **`panel` (250ms)**: Side sheets, contextual settings drawers.
- **`page` (200ms)**: View transitions and initial component mounts.

### 1.2 Easing Curves
- **`easeOut` (`[0.16, 1, 0.3, 1]`)**: Decelerating curve for natural entrances and user interactions.
- **`easeInOut` (`[0.4, 0, 0.2, 1]`)**: Balanced curve for persistent drawers and sliding dividers.
- **`snappy` (`[0.2, 0, 0, 1]`)**: Snappy curve for popovers and tooltips.

### 1.3 Springs (Restrained)
- Springs are tuned with **NO bounce or overshoot** to maintain enterprise visual stability:
  `{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }`.

---

## 2. Interaction Scales

| Element Type | Hover Scale | Active / Tap Scale |
| :--- | :--- | :--- |
| **Buttons** | `1.01` (+1%) | `0.98` (-2%) |
| **Action Icons** | `1.05` (+5%) | `0.94` (-6%) |
| **Cards (Hoverable)** | `1.002` (+0.2%) | `0.995` (-0.5%) |
| **Subtle Items** | `1.005` (+0.5%) | `0.985` (-1.5%) |

---

## 3. CSS Utility Transitions

Where Framer Motion is not required, use standardized Tailwind CSS transition classes:

```css
/* Standard Button / Input */
transition-all duration-150 ease-out active:scale-[0.98]

/* Standard Card / Elevation */
transition-all duration-200 ease-out

/* Fast Fade In */
animate-in fade-in-0 duration-150 ease-out
```

---

## 4. Accessibility & Reduced Motion

ClixProCRM provides strict compliance with the CSS `prefers-reduced-motion` media query.

Globally enforced in `globals.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Components utilizing Tailwind animations include:
```css
motion-reduce:transition-none motion-reduce:transform-none motion-reduce:hover:scale-100
```

---

## 5. Anti-Patterns & Prohibitions

❌ **DO NOT USE**:
- Bouncy, playful spring overshoots on modals or tables.
- Durations exceeding 300ms for standard UI interactions (which make the app feel sluggish).
- Full page re-render slide transitions on minor state changes.
- Layout animations (`layout` prop in Framer Motion) on large data tables (causes CPU spikes).
