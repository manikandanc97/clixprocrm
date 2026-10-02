# PHASE 6 - STAGE 3: SERVER COMPONENT AUDIT

## CURRENT STATE
We performed a codebase inventory for `"use client"` boundaries and discovered that many major route entry points (`page.tsx`) are configured as Client Components.

## UNNECESSARY HIGH BOUNDARIES IDENTIFIED

### 1. Super Admin Module
Almost all pages in `app/(super-admin)` have the client boundary at the top level `page.tsx`:
- `app/(super-admin)/super-admin/page.tsx`
- `app/(super-admin)/super-admin/settings/page.tsx`
- `app/(super-admin)/super-admin/security/page.tsx`
- `app/(super-admin)/super-admin/organizations/page.tsx`
- `app/(super-admin)/super-admin/users/page.tsx`
- `app/(super-admin)/super-admin/plans/page.tsx`
- `app/(super-admin)/super-admin/support/page.tsx`

**Why it's sub-optimal:** 
These pages wrap their contents in `<CRMPageContainer>` and `<CRMPageHeader>`. By making the entire page a Client Component, we force the browser to parse, evaluate, and hydrate these layout components. 

**Recommendation:**
Refactor these pages:
1. `page.tsx` becomes a **Server Component** (no `"use client"`).
2. It renders `<CRMPageContainer>` and `<CRMPageHeader>` natively on the server.
3. The interactive parts (tables, forms, API fetching) are moved into a smaller Client Component (e.g., `<SettingsClient />`, `<UsersClient />`).

### 2. General Dashboard Pages
- `app/(dashboard)/support/tickets/[id]/page.tsx`
- `app/(dashboard)/settings/page.tsx`

These exhibit the same issue. The client boundary is pushed too high.

### 3. Error / Utility Pages
- `app/unauthorized/page.tsx`
- `app/account-deleted/page.tsx`

These pages are static message pages but are marked as `"use client"`. They do not need browser APIs, hooks, or event handlers. 
**Recommendation:** Remove `"use client"` completely.

## ACTIONABLE STEPS
1. Remove `"use client"` from `unauthorized`, `account-deleted` pages immediately.
2. Refactor at least one major heavy page (e.g., `super-admin/settings/page.tsx`) to prove the bundle reduction by lowering the boundary.
3. Since refactoring all `page.tsx` files involves extensive testing for API fetching and state management, we will focus on the static pages and the heaviest route first to establish the pattern.
