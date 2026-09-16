# ClixProCRM Phase 3 Performance Audit
**Real Performance Audit & Bottleneck Discovery (Read-Only Analysis)**

---

## 1. Executive Summary

This comprehensive Phase 3 audit evaluates the full-stack performance of **ClixProCRM**, covering the Next.js 16 / React 19 frontend (`web/`), NestJS 11 / Fastify backend (`api/`), PostgreSQL / Prisma schema, database query execution patterns, network waterfalls, bundle composition, and runtime rendering.

### Primary Architectural Findings
1. **Unbounded Database Queries & In-Memory PII Decryption**: Several query handlers (notably `PipelineService.getPipeline` and `CustomersService.getCustomers` with search) perform unbounded `findMany()` calls over entire tenant datasets, load all rows into Node.js memory, execute CPU-intensive AES-256-GCM decryption loops on every field, and run client/server-side array filtering.
2. **Dashboard Query Monolith (26 Queries in a Single Transaction)**: `/api/dashboard` runs 26 parallel queries inside a single `prisma.withTenantContext` transaction block on every load, holding transaction slots open on the connection pool and executing full-table scans for sparkline generation.
3. **Redundant Dashboard Initial Fetches**: `DashboardPage` calls `useLeads()` and `usePipeline()` on initial mount solely to calculate an `isWorkspaceEmpty` flag, transferring full CRM entity payloads even when the dashboard summary API already possesses metric counts.
4. **Per-Request Auth Interceptor Overhead**: The Axios client interceptor asynchronously invokes `supabase.auth.getSession()` on *every single outgoing API request*, adding serialization and storage lookup latency before request dispatch.
5. **Context Invalidation Cascade**: `SettingsProvider` (wrapping the entire application at the root) constructs an inline unmemoized context value and subscribes to `usePathname()`, triggering full re-renders of settings consumers on every route transition.
6. **Client-Side Slicing of Truncated Datasets**: The `Contacts` and `Tasks` pages fetch data without server-side pagination arguments (receiving only the first 50 rows), then perform client-side slicing and filtering, causing both client CPU thrashing and incomplete data representation for growing workspaces.

---

## 2. Current Performance Architecture

| Layer | Technology | Current Implementation & Characteristics |
|---|---|---|
| **Frontend Framework** | Next.js 16.2.4 (App Router) + React 19.2.4 | Dynamic imports used for some heavy modals and widgets; standard client-rendered CRM workspace. |
| **Server State & Caching** | `@tanstack/react-query` v5.100.9 | Default `staleTime: 2m`, `gcTime: 10m`, `refetchOnWindowFocus: false`, `retry: 1`. In-flight GET deduplication in Axios client. |
| **Client State** | Zustand v5.0.13 | `useCRMStore` persisted in `localStorage` under `crm-storage` (v4). |
| **Backend API** | NestJS v11 + Fastify (`@nestjs/platform-fastify`) | High-throughput Fastify HTTP adapter, standard NestJS DI modules. |
| **Database & ORM** | PostgreSQL + Prisma v6.19.3 | Row-level tenant context via `prisma.withTenantContext({ tenantId })`, AES-256-GCM encrypted PII fields with HMAC-SHA256 blind indexing (`emailHash`, `nameHash`). |
| **Styling & Animation** | Tailwind CSS v4 + Framer Motion v12.38 | Hybrid: Tailwind CSS keyframe animations alongside runtime `framer-motion` instances on cards and modals. |

---

## 3. Confirmed Performance Issues

### [P0] Unbounded Query & In-Memory Sparkline Calculation in Pipeline Service
- **Priority**: P0
- **File**: `api/src/deals/services/pipeline.service.ts`
- **Component / Function**: `PipelineService.getPipeline`
- **Evidence**:
  ```ts
  tx.deal.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: [{ stage: 'asc' }, { updatedAt: 'desc' }],
    select: { ... },
  })
  ```
  Followed by in-memory filtering:
  ```ts
  for (let i = 6; i >= 0; i--) {
    const activeDealsOnDay = deals.filter(
      (l) => l.createdAt < dEnd && (!['WON', 'LOST'].includes(l.stage) || l.updatedAt >= dEnd)
    ).length;
  }
  ```
- **Why It Matters**: There is zero limit or pagination on the deals query. For workspaces with thousands of deals, every call transfers all deals from Postgres, decrypts associated company/customer names, and runs nested array iterations.
- **Estimated Impact**: Extreme server latency (1s - 5s+ for 5k+ deals), event loop blocking, memory spikes.
- **Runtime Measurement Required**: No (architectural algorithmic flaw $O(N)$ memory and $O(7N)$ filtering on every request).
- **Recommended Fix**: Add a SQL-level date aggregation query for sparklines (`COUNT GROUP BY date_trunc('day', ...)`), aggregate pipeline stats in SQL, and paginate deal cards by stage or virtualize the kanban board.
- **Risk Level**: Medium (requires refactoring the pipeline return contract to support stage pagination).

---

### [P0] Full Tenant Dataset Scan & Decryption Loop on Customer Search
- **Priority**: P0
- **File**: `api/src/customers/customers.service.ts`
- **Component / Function**: `CustomersService.getCustomers`
- **Evidence**:
  ```ts
  if (searchTrimmed) {
    const allCustomers = await tx.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { deals: { where: { status: { not: 'LOST' } } } } },
        deals: { select: { value: true, stage: true } },
      },
    });
    const mapped = allCustomers.map((c) => ({
      ...c,
      name: this.enc.decrypt(c.name),
      email: this.enc.decrypt(c.email),
      company: this.enc.decrypt(c.company),
      ...
    }));
    const filtered = mapped.filter(...);
  }
  ```
- **Why It Matters**: When a user types into the customer search box, the backend ignores pagination, fetches *all* customer records for the tenant along with all deal relations, runs 3 AES-256-GCM decrypt operations per customer in Node.js, and filters in memory before slicing.
- **Estimated Impact**: Severe API latency, heavy CPU utilization on the Node server, potential denial of service under multiple concurrent searches.
- **Runtime Measurement Required**: No (confirmed code path).
- **Recommended Fix**: Use HMAC-SHA256 blind indexing for exact searches, and implement trigram/search indexes or tokenized search hashes for prefix search; restrict search candidate rows in SQL before decryption.
- **Risk Level**: Medium.

---

### [P1] Redundant `useLeads` & `usePipeline` Payload Fetches on Dashboard Mount
- **Priority**: P1
- **File**: `web/app/(dashboard)/dashboard/page.tsx`
- **Component / Function**: `DashboardPage` (`isWorkspaceEmpty` evaluation)
- **Evidence**:
  ```ts
  const { isInitializing } = useDashboardInitializer(activeTimeframe);
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardData();
  const { data: leadsData, isLoading: isLeadsLoading } = useLeads();
  const { data: pipelineData, isLoading: isPipelineLoading } = usePipeline();
  ```
  `leadsData` and `pipelineData` are ONLY used inside `isWorkspaceEmpty` to check if `totalLeadsCount === 0 && totalDealsCount === 0`.
- **Why It Matters**: Visiting `/dashboard` immediately triggers `/api/leads` and `/api/pipeline` network calls, downloading large payloads that are never rendered on the dashboard page.
- **Estimated Impact**: Wasted network bandwidth, 2 unnecessary backend queries per dashboard view, longer time to interactive.
- **Runtime Measurement Required**: No (direct code dependency).
- **Recommended Fix**: Have `/api/dashboard` return workspace summary counts (`totalLeads`, `totalDeals`, `isWorkspaceEmpty`), and remove `useLeads()` and `usePipeline()` from `DashboardPage`.
- **Risk Level**: Low.

---

### [P1] Asynchronous `getSession` Execution on Every Outgoing Axios Request
- **Priority**: P1
- **File**: `web/shared/lib/api/client.ts`
- **Component / Function**: `client.interceptors.request`
- **Evidence**:
  ```ts
  const supabase = createClient();
  const sessionPromise = supabase.auth.getSession();
  const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
    setTimeout(() => resolve({ data: { session: null } }), 4000)
  );
  const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
  if (session?.access_token) {
    config.headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  ```
- **Why It Matters**: Every HTTP request made via Axios runs `supabase.auth.getSession()` and creates a 4-second timeout Promise race. When 8 widgets fetch concurrently on page load, 8 asynchronous Supabase session lookups execute in parallel.
- **Estimated Impact**: Adds 10ms–80ms latency to every single frontend API call.
- **Runtime Measurement Required**: No.
- **Recommended Fix**: Maintain an in-memory token/session cache inside `AuthProvider` / singleton module updated via `onAuthStateChange`, and read the token synchronously from memory in the request interceptor.
- **Risk Level**: Low.

---

### [P1] Root-Level `SettingsProvider` Inline Context Value Recreation on Route Change
- **Priority**: P1
- **File**: `web/features/dashboard/components/SettingsContext.tsx`
- **Component / Function**: `SettingsProvider`
- **Evidence**:
  ```ts
  const pathname = usePathname();
  // ...
  return (
    <SettingsContext.Provider value={{ 
      accentColor: activeAccent as AccentColor, 
      setAccentColor: handleSetAccentColor, 
      fontFamily: activeFont as FontFamily, 
      setFontFamily: handleSetFontFamily,
      dashboardScope,
    }}>
      {children}
    </SettingsContext.Provider>
  );
  ```
- **Why It Matters**: `usePathname()` triggers on every route transition. Because the context `value` object is created as a new literal on every render and handler functions are not memoized, all consumers of `useSettings()` re-render on every navigation.
- **Estimated Impact**: Unnecessary re-rendering of header, profile menu, and settings consumers on every route transition.
- **Runtime Measurement Required**: No.
- **Recommended Fix**: Memoize `value` with `useMemo()` and wrap `handleSetAccentColor` / `handleSetFontFamily` in `useCallback()`.
- **Risk Level**: Very Low.

---

### [P1] Truncated Client-Side Filtering in `useContactsData` and `useTasksData`
- **Priority**: P1
- **File**: `web/features/contacts/hooks/use-contacts-data.ts` & `web/features/tasks/hooks/use-tasks-data.ts`
- **Component / Function**: `useContactsData` / `useTasksData`
- **Evidence**:
  - `useContactsData` calls `useLeads(undefined)` and `useCustomers(undefined)`, retrieving default 50 leads and 10 customers.
  - It then sorts, searches, and paginates client-side: `paginatedContacts = filteredContacts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)`.
- **Why It Matters**:
  1. Data integrity bug: records beyond the initial 50 rows are invisible to search and pagination.
  2. CPU overhead: search filtering and sorting runs in-memory on every keystroke.
- **Estimated Impact**: Incorrect data display and unnecessary client-side compute.
- **Runtime Measurement Required**: No.
- **Recommended Fix**: Pass `page`, `limit`, `search`, and `status` query parameters to the backend hooks and use server-side pagination.
- **Risk Level**: Medium.

---

## 4. Suspected Performance Issues

### [P2] Connection Pool Saturation from 26 Parallel Queries in `DashboardService`
- **Priority**: P2
- **File**: `api/src/insights/services/dashboard.service.ts`
- **Component / Function**: `DashboardService.getDashboardData`
- **Evidence**: A single HTTP request to `/api/dashboard` issues 26 parallel Prisma queries inside `withTenantContext(async (tx) => { await Promise.all([...]) })`.
- **Why It Matters**: If 10 users load their dashboard simultaneously, 260 database queries hit Postgres concurrently across transaction slots.
- **Estimated Impact Category**: Backend throughput & DB connection pool exhaustion under multi-user concurrency.
- **Runtime Measurement Required**: Yes (benchmark under load with k6 / autocannon).
- **Recommended Fix**: Consolidate deal count/sum queries into 1-2 raw SQL aggregation queries (`$queryRaw`) matching the pattern already used in `AnalyticsService`.
- **Risk Level**: Low.

---

### [P2] Missing Composite Indexes on High-Frequency Filter Combinations
- **Priority**: P2
- **File**: `api/prisma/schema.prisma`
- **Component / Function**: `Quotation`, `TimelineEvent`, `Meeting`
- **Evidence**:
  - `Quotation`: Has `@@unique([tenantId, quoteNumber])`, `@@index([customerId])`, `@@index([assignedToId])`, `@@index([leadId])`, `@@index([tenantId, teamId])`, but NO index on `@@index([tenantId, status])` or `@@index([tenantId, deletedAt, createdAt])`.
  - `TimelineEvent`: Has `@@index([tenantId, leadId])` and `@@index([tenantId, createdAt])`, but queries on `dealId`, `customerId`, `companyId`, `taskId` filter without composite tenant indexes.
- **Why It Matters**: As timeline events and quotations grow past 50,000 rows, queries filtering by tenant and status/deal will degrade to sequential index filter scans.
- **Estimated Impact Category**: Database query execution time.
- **Runtime Measurement Required**: Yes (verify Postgres `EXPLAIN ANALYZE` execution plans on large dataset).
- **Recommended Fix**: Add targeted composite indexes to `schema.prisma`.
- **Risk Level**: Low (index-only schema migration).

---

## 5. React Rendering Hotspots

| Component / Hook | File | Root Cause | Impact | Fix Recommendation |
|---|---|---|---|---|
| `CRMCard` | `web/shared/components/crm/CRMCard.tsx` | `animate = true` default creates a `motion.div` instance with runtime JS animation evaluation for every single card on the page. | Medium | Default `animate` to `false` or replace with CSS utility classes (`transition-all`, `animate-in`). |
| `SettingsProvider` | `web/features/dashboard/components/SettingsContext.tsx` | Unmemoized object passed to `SettingsContext.Provider` value; re-renders on route changes via `usePathname()`. | Medium | Wrap context value in `useMemo()` and setters in `useCallback()`. |
| `DashboardKPIs` | `web/features/dashboard/components/DashboardKPIs.tsx` | Invokes `useDashboardData()`, `useLeads()`, and `usePipeline()` independently inside the component, duplicating queries run by parent `DashboardPage`. | Low-Medium | Rely on `useDashboardData()` which already contains the computed KPI metrics. |
| `useContactsData` | `web/features/contacts/hooks/use-contacts-data.ts` | Four chained `useMemo` hooks calculating combined arrays, metrics, string filtering, and multi-field sorting on every keystroke. | Medium | Move pagination, filtering, and sorting to the backend API. |

---

## 6. Dashboard Hotspots

### Current Initial Render Flow
1. **Initial Mount**: `DashboardPage` mounts and executes:
   - `useDashboardInitializer` $\to$ `/crm/dashboard?timeframe=month`
   - `useLeads` $\to$ `/crm/leads` (unnecessary, for empty check)
   - `usePipeline` $\to$ `/crm/pipeline` (unnecessary, for empty check)
2. **Child Widgets**:
   - `RevenueChartWidget` $\to$ `useAnalytics()` $\to$ `/crm/analytics`
   - `UpcomingMeetingsWidget` $\to$ `useMeetings()` $\to$ `/crm/meetings`
   - `PendingFollowupsWidget` $\to$ `useTasks()` $\to$ `/crm/tasks`
   - `HotLeadsWidget` $\to$ `useHotLeads()` $\to$ `/crm/hot-leads`
   - `RecentActivitiesWidget` $\to$ `useDashboardData()` (reused from cache)
   - `RecentCustomersWidget` $\to$ `useCustomers()` $\to$ `/crm/customers`
   - `RevenueTargetWidget` $\to$ `useDashboardData()` (reused from cache)
   - `AIInsights` $\to$ `useAiInsights()` $\to$ `/crm/ai-insights`
   - `CalendarWidget` $\to$ `useMeetings()` (reused from cache)

### Bottleneck Analysis
- **Widget Concurrency**: 8 distinct HTTP requests fire on dashboard load (`/dashboard`, `/leads`, `/pipeline`, `/analytics`, `/meetings`, `/tasks`, `/hot-leads`, `/customers`, `/ai-insights`).
- **Duplicate Mounting Animations**: `DashboardWidgetWrapper` applies Tailwind CSS `animate-in fade-in` on the wrapper `<div>` AND Framer Motion `<AnimatePresence><motion.div>` on the content, causing double animation pipelines during hydration.

---

## 7. API Request Hotspots

| Endpoint | Calling File / Hook | Issue | Frequency | Impact |
|---|---|---|---|---|
| `GET /crm/leads` | `DashboardPage` | Triggered purely for `isWorkspaceEmpty` check. | On every dashboard page mount. | Medium (transfers entire leads payload unnecessarily). |
| `GET /crm/pipeline` | `DashboardPage` | Triggered purely for `isWorkspaceEmpty` check. | On every dashboard page mount. | High (triggers unbounded backend deal query). |
| `GET /crm/customers` | `DashboardPage` / `RecentCustomersWidget` | Fetches customer list for a 5-item widget without `limit: 5`. | On dashboard mount. | Medium (fetches default 10 customers with full deal includes). |
| All Endpoints | `client.interceptors.request` | Async `supabase.auth.getSession()` called before every request. | Every single API request. | Medium (adds 10-50ms latency per dispatch). |

---

## 8. Backend/API Hotspots

| Service / Controller | Endpoint | Issue Description | Query Evidence | Severity |
|---|---|---|---|---|
| `PipelineService` | `GET /crm/pipeline` | Unbounded `findMany()` on all deals for tenant + in-memory 7-day sparkline date filters. | `tx.deal.findMany({ where: { tenantId, deletedAt: null } })` | **P0 (Critical)** |
| `CustomersService` | `GET /crm/customers` (search) | Full table scan of tenant customers + AES decryption loop on search string. | `tx.customer.findMany({ where: { tenantId, deletedAt: null }, include: { deals: ... } })` | **P0 (Critical)** |
| `DashboardService` | `GET /crm/dashboard` | 26 parallel queries inside one `withTenantContext` transaction; finds all won deals in current year without limit for chart calculation. | `tx.deal.findMany({ where: { tenantId, deletedAt: null, stage: 'WON', updatedAt: { gte: startOfCurrentYear } } })` | **P1 (High)** |
| `LeadsQueryService` | `GET /crm/leads` | Paginates encrypted rows in SQL first, then runs JS substring filter on decrypted names, which breaks cross-page search results. | Decrypts 50 rows, then filters in JS: `decryptedLeads.filter(...)` | **P1 (High)** |

---

## 9. Prisma & Database Query Risks

### Index Coverage Analysis
1. **Quotation Table**:
   - `@@unique([tenantId, quoteNumber])`
   - `@@index([customerId])`, `@@index([assignedToId])`, `@@index([leadId])`, `@@index([tenantId, teamId])`
   - ⚠️ **Missing Index**: `@@index([tenantId, status])` and `@@index([tenantId, deletedAt, createdAt])`. Status filtering on quotes will perform index filter scans.
2. **TimelineEvent Table**:
   - `@@index([tenantId])`, `@@index([leadId])`, `@@index([invoiceId])`, `@@index([tenantId, leadId])`, `@@index([tenantId, createdAt])`
   - ⚠️ **Missing Composite Indexes**: `@@index([tenantId, dealId])`, `@@index([tenantId, customerId])`, `@@index([tenantId, companyId])`, `@@index([tenantId, taskId])`.
3. **Meeting Table**:
   - `@@index([tenantId, startTime, endTime])`, `@@index([tenantId, ownerId])`, `@@index([tenantId, assignedToId])`
   - ⚠️ **Missing Index**: `@@index([tenantId, status])` and `@@index([tenantId, startTime])` (for single-bound date filters like `startTime >= now`).

---

## 10. Bundle & Code Splitting Opportunities

| Package / Component | Size / Weight Category | Current Loading Behavior | Recommended Strategy |
|---|---|---|---|
| `xlsx` | Heavy (~300 KB gzipped) | Dynamically imported in `bulk-import-utils.ts` (`await import('xlsx')`). | **Optimal** (Already dynamically loaded on interaction). |
| `papaparse` | Medium (~25 KB) | Statically imported at top of `bulk-import-utils.ts`. | Keep dynamic with `BulkImportModal` (which is already dynamically loaded). |
| `canvas-confetti` | Medium (~15 KB) | Statically imported inside `DashboardCelebration.tsx`. | Dynamically import `canvas-confetti` inside the `triggerConfetti()` function to avoid bundling on initial dashboard load. |
| `recharts` | Heavy (~150 KB gzipped) | Used across `RevenueChart`, `LeadSourceChart`, `Analytics`, `PlatformUsageHealthRow`. | Dynamically load charts on dashboard and super-admin pages using `next/dynamic` with skeleton fallbacks. |
| `TaskContextualSettings` / `LeadContextualSettings` | Medium-Heavy (~60-70 KB each) | Loaded dynamically on drawers. | **Optimal**. |

---

## 11. Large List / Table Risks

### Findings:
1. **Contacts Table (`ContactsDataTable`)**: Renders up to 50 rows per page. DOM node count is ~500 nodes (acceptable without virtualization), but client-side sorting and filtering of combined arrays should be transferred to server pagination.
2. **Tasks Table (`TasksDataTable`)**: Standard 10–50 rows per page with server pagination. Virtualization is not required if table stays capped at $\le 50$ rows per page.
3. **Pipeline Kanban Board**: If a workspace has hundreds of open deals in a single stage column, rendering all cards simultaneously without virtualization or column limits causes significant DOM and reflow overhead during drag-and-drop (`@dnd-kit`).

---

## 12. Remaining Framer Motion Analysis

| Category | File / Component | Usage Description | Recommendation |
|---|---|---|---|
| **A. KEEP** | `BulkImportModal.tsx` | Multi-step wizard slide transitions with `AnimatePresence`. | Keep Framer Motion (valuable UX state transition). |
| **A. KEEP** | `ContextualSettingsDrawer.tsx` | Slide-over drawer with backdrop fade. | Keep Framer Motion. |
| **A. KEEP** | `BaseSidebar.tsx` | Sidebar collapse/expand width and label animations. | Keep Framer Motion. |
| **B. CSS CANDIDATE** | `CRMCard.tsx` | Simple fade + translateY entrance animation on static cards. | Replace with CSS utility / Tailwind transition. |
| **B. CSS CANDIDATE** | `DashboardWidgetWrapper.tsx` | Opacity transitions for loading / error / content states. | Replace with Tailwind `animate-in fade-in`. |
| **B. CSS CANDIDATE** | `ViewToggle.tsx` | Tab toggle indicator pill animation. | Can use CSS layout transition or lightweight layoutId. |
| **C. REMOVE CANDIDATE** | `ActivityItem.tsx` | Motion applied to individual small list items. | Remove motion; use CSS hover transitions. |
| **D. INVESTIGATE** | `PipelineCard.tsx` | Motion on draggable kanban cards. | Test drag performance with `@dnd-kit` vs pure CSS transforms. |

---

## 13. Provider / Context Render Risks

1. **`SettingsProvider`**:
   - Location: `web/app/providers.tsx` $\to$ `web/features/dashboard/components/SettingsContext.tsx`
   - Problem: Recreates value object on every render; invokes `usePathname()` triggering on every navigation.
   - Impact: Subscribed components re-render on route changes.
2. **`AuthProvider`**:
   - Location: `web/features/auth/components/auth-provider.tsx`
   - Status: Well-memoized value (`useMemo` with minimal stable dependencies).
   - Finding: Token is already set to `null` to avoid token-change cascades.
3. **`SidebarProvider`**:
   - Location: `web/features/dashboard/components/SidebarContext.tsx`
   - Status: Well-memoized (`React.useMemo` on `sidebarCollapsed`).

---

## 14. Recommended Fix Order

| Order | Priority | Component / Layer | Action Item | Estimated Complexity |
|---|---|---|---|---|
| **1** | **P0** | Backend `PipelineService` | Add date aggregation in SQL for sparklines and stage counts; remove unbounded deal query. | Medium |
| **2** | **P0** | Backend `CustomersService` | Fix search query to prevent full-table tenant loading and decryption in Node.js. | Medium |
| **3** | **P1** | Frontend `DashboardPage` | Remove `useLeads()` and `usePipeline()` from `DashboardPage`; retrieve workspace counts directly from dashboard summary API. | Low |
| **4** | **P1** | Frontend `client.ts` | Replace per-request async `supabase.auth.getSession()` with synchronous in-memory token retrieval. | Low |
| **5** | **P1** | Frontend `SettingsContext` | Wrap `SettingsContext.Provider` value in `useMemo` and callbacks in `useCallback`. | Very Low |
| **6** | **P1** | Frontend `useContactsData` / `useTasksData` | Connect frontend filters and pagination directly to backend query parameters instead of in-memory slicing of 50 items. | Medium |
| **7** | **P2** | Backend `DashboardService` | Consolidate the 26 parallel queries into optimized SQL aggregation queries (`$queryRaw`). | Medium |
| **8** | **P2** | Database Indexes (`schema.prisma`) | Add missing composite indexes for Quotation, TimelineEvent, and Meeting. | Low |
| **9** | **P2** | Frontend `CRMCard` & `DashboardWidgetWrapper` | Clean up redundant Framer Motion wrapper instances in favor of CSS transitions. | Low |
| **10** | **P3** | Dynamic Imports | Dynamically import `canvas-confetti` inside celebration handlers. | Very Low |

---

## 15. Measurement Plan

| Target Area | Metric | Tool / Instrumentation | Target Threshold |
|---|---|---|---|
| **Pipeline API** | Response time (`GET /crm/pipeline`) | Fastify request timing / Chrome DevTools Network | $< 150\text{ ms}$ for 5,000 deals |
| **Customer Search API** | Response time (`GET /crm/customers?search=...`) | Fastify request timing / Server logs | $< 100\text{ ms}$ |
| **Dashboard API** | Response time & DB query count (`GET /crm/dashboard`) | Prisma query logging / Fastify server metrics | $< 120\text{ ms}$, $\le 3$ SQL queries |
| **Frontend Dashboard Mount** | Total initial network requests on `/dashboard` | Chrome DevTools Network panel | $\le 6$ concurrent requests (down from 9) |
| **Axios Dispatch Latency** | Pre-flight request interceptor duration | `performance.now()` in Axios interceptor | $< 1\text{ ms}$ (down from 10-50ms) |
| **Route Transition Renders** | Number of re-rendered components on navigation | React DevTools Profiler | 0 unnecessary context consumer re-renders |
