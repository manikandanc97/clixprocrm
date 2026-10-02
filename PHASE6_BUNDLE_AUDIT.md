# PHASE 6 - STAGE 1: NEXT.JS BUNDLE ANALYSIS

Based on the `@next/bundle-analyzer` and Webpack chunk sizes for the production build, we have identified the top contributors to the JavaScript payload.

## LARGEST THIRD-PARTY MODULES (Parsed Sizes)

| Package / Module | Size Impact | Reason for load | Recommendation |
|------------------|-------------|-----------------|----------------|
| `xlsx` | **401.47 KB** | Excel/CSV Export/Import functionality | **Code Split (Dynamic Import)**. This library should ONLY load when a user clicks "Export to Excel" or opens the "Bulk Import" modal. Currently inflating a large chunk. |
| `react-dom` | **~365 KB** | React client rendering core | Unavoidable base cost. However, we can reduce how much React DOM needs to hydrate by aggressively migrating Client Components to Server Components. |
| `@supabase/auth-js` | **62.26 KB** | Authentication | Unavoidable for client-side auth. But we must ensure it's not loaded on public unauthenticated routes unnecessarily. |
| `ai` (Vercel AI SDK) | **60.78 KB** | AI Chat / Insights features | **Code Split / Route specific**. Should only load on routes that feature the AI Copilot. |
| `@dnd-kit/core` | **38.38 KB** | Drag and drop (Kanban) | Ensure it only loads on the Pipeline/Deals page. |
| `sonner` | **32.72 KB** | Toast notifications | Generally global, but we can verify if it's imported optimally. |
| `react-hook-form` | **31.81 KB** | Form handling | Often loaded globally. Convert non-interactive or purely server-action forms to native forms where possible, though `react-hook-form` is very efficient. |
| `@ai-sdk/provider-utils`| **27.95 KB** | AI utilities | Same as the `ai` package. |
| `@supabase/postgrest-js`| **26.51 KB** | Supabase data fetching | Required. |
| `tailwind-merge` | **25.40 KB** | Dynamic Tailwind classes | Loaded heavily through `utils/cn.ts`. |
| `zod` | **23.05 KB** | Schema validation | Often used in client forms. |
| `framer-motion` | **18.99 KB** | Animations | Ensure we use lazy motion or avoid global imports if animations are limited to specific components. |
| `papaparse` | **18.72 KB** | CSV Parsing | **Code Split**. Like `xlsx`, should only load in the Bulk Import component. |
| `@radix-ui/react-select`| **18.13 KB** | Select Dropdowns | Loaded in many places. |
| `recharts` | **>15 KB** | Charts (Dashboard/Analytics) | **Code Split (Dynamic Import)**. Charts are heavy and should not block initial interactivity on non-chart pages. |

## HEAVIEST ROUTE-LEVEL COMPONENTS
The following route components are unusually large and should be optimized:
- `app/(super-admin)/super-admin/support/[id]/page.tsx` (24.10 KB)
- `app/(dashboard)/support/page.tsx` (19.74 KB + 15.56 KB)
- `app/(super-admin)/super-admin/settings/page.tsx` (19.66 KB)
- `app/(dashboard)/support/tickets/[id]/page.tsx` (17.76 KB)
- `app/(dashboard)/settings/page.tsx` (15.52 KB)

## ACTION PLAN
1. **Dynamic Imports for Heavy Libraries**: Wrap components that use `xlsx`, `papaparse`, `recharts`, and `@dnd-kit` in `next/dynamic`.
2. **AI SDK Isolation**: Ensure the `ai` package is only loaded in the Copilot/AI sidebar and not globally.
3. **Route Component Audit**: Inspect the heavy support/settings route components to see if they are unnecessarily `use client` boundaries.
