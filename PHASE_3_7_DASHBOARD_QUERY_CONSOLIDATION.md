# Phase 3.7 — Dashboard Query Consolidation & Database Efficiency

## 1. Executive Summary

In Phase 3.7, we audited and optimized the data-fetching and query execution strategy for `DashboardService` (`api/src/insights/services/dashboard.service.ts`), which powers `GET /crm/dashboard` and `GET /crm/dashboard/employee`.

Prior to this phase:
- `getDashboardData` executed **26 separate database queries** inside a single tenant transaction (`withTenantContext`), consisting of:
  - 18 separate `COUNT` and `aggregate` (`_sum.value`) queries across `Deal`, `Lead`, `Customer`, and `Task`.
  - 4 unbounded `findMany` queries loading all won deals for the current year, all deals created in the last 7 days, all won deals in the last 7 days, and all leads in the last 7 days into Node.js memory for JavaScript grouping, date parsing, and mapping loops.
  - 3 bounded `findMany` queries for recent activities (`take: 5`).
  - 1 index lookup (`findFirst`) for active revenue target.
- `getEmployeeDashboardData` executed **7 separate database queries** (5 individual counts for tasks, meetings, leads, and deals, plus 2 bounded recent activity queries).

In Phase 3.7, we consolidated:
1. All 18 separate KPI count and revenue aggregation queries into **1 single high-performance parameterized SQL scalar query**.
2. Monthly won sales data into **1 SQL aggregation query** grouping by month index directly in PostgreSQL.
3. 7-day sparkline data into **1 SQL series aggregation query** generating day buckets and joining daily counts/sums in PostgreSQL.
4. All 5 employee metric counts into **1 consolidated SQL query**.

This reduced the total query count from **26 to 7** for `getDashboardData` (a **73% reduction** in database round-trips) and completely eliminated all 4 unbounded table scans and in-memory JS processing loops, while strictly preserving API response contracts, date semantics, and tenant isolation.

---

## 2. Current Dashboard Query Inventory

### Initial State (`GET /crm/dashboard`)

| # | Purpose | Table | Type | Rows Loaded | Consolidated In Phase 3.7? |
|---|---|---|---|---|---|
| 1 | Tenant currency check | `Tenant` | Cached / findUnique | 1 row | Kept (Cached in memory) |
| 2 | Total deals count | `Deal` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 3 | Current period deals count | `Deal` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 4 | Previous period deals count | `Deal` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 5 | Active deals count | `Deal` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 6 | Previous active deals count | `Deal` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 7 | Total won deals count | `Deal` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 8 | Total lost deals count | `Deal` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 9 | Total won revenue sum | `Deal` | `aggregate()` | 0 (scalar) | Yes &rarr; Query 1 |
| 10 | Current period won revenue sum | `Deal` | `aggregate()` | 0 (scalar) | Yes &rarr; Query 1 |
| 11 | Previous period won revenue sum | `Deal` | `aggregate()` | 0 (scalar) | Yes &rarr; Query 1 |
| 12 | Total leads count | `Lead` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 13 | Current period leads count | `Lead` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 14 | Previous period leads count | `Lead` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 15 | Current period customers count | `Customer` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 16 | Previous period customers count | `Customer` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 17 | Pending tasks total count | `Task` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 18 | Current period pending tasks count | `Task` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 19 | Previous period pending tasks count | `Task` | `count()` | 0 (scalar) | Yes &rarr; Query 1 |
| 20 | Monthly won sales chart | `Deal` | `findMany()` | Unbounded (all won deals this year) | Yes &rarr; Query 2 (max 12 rows) |
| 21 | 7-day deals sparkline | `Deal` | `findMany()` | Unbounded (all deals in 7 days) | Yes &rarr; Query 3 (7 rows) |
| 22 | 7-day won revenue sparkline | `Deal` | `findMany()` | Unbounded (all won deals in 7 days) | Yes &rarr; Query 3 (7 rows) |
| 23 | 7-day leads sparkline | `Lead` | `findMany()` | Unbounded (all leads in 7 days) | Yes &rarr; Query 3 (7 rows) |
| 24 | Recent Deals | `Deal` | `findMany(take: 5)` | 5 rows | Kept separate (bounded take: 5) |
| 25 | Recent Quotations | `Quotation` | `findMany(take: 5)` | 5 rows | Kept separate (bounded take: 5) |
| 26 | Recent Completed Tasks | `Task` | `findMany(take: 5)` | 5 rows | Kept separate (bounded take: 5) |
| 27 | Active Revenue Target | `RevenueTarget` | `findFirst()` | 1 row | Kept separate (indexed findFirst) |

---

## 3. Verified Bottlenecks

1. **Massive Parallel Round-Trips (26 concurrent queries)**:
   Firing 26 simultaneous queries through Prisma transaction handles exhausts database connection pool slots, causes connection queueing under multi-user concurrency, and incurs significant serialization/deserialization overhead in Node.js.
2. **Unbounded Memory Allocation & Slicing/Looping**:
   - `monthlySalesRaw`: Fetched all won deals for the current year into Node.js memory just to aggregate by month index. For high-volume tenants, this loaded thousands of objects.
   - `sparklineDealsRaw`, `sparklineRevenueRaw`, and `sparklineLeadsRaw`: Fetched all raw deals/leads created in the last 7 days into Node.js arrays, built 3 JavaScript `Map`s, and looped over dates in memory.
3. **Repeated Table Filters**:
   The `Deal` table was scanned 13 separate times during a single dashboard load for different date ranges, stage conditions, and aggregation metrics.

---

## 4. Queries Consolidated

### 1. Unified KPI Metrics (`summaryRaw`)
Consolidated 18 separate queries (queries 2–19) into 1 single parameterized query:
```sql
SELECT
  -- Deal metrics
  (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL) AS total_deals,
  (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${currentStart} AND "createdAt" < ${nextStart}) AS current_period_deals,
  (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) AS prev_period_deals,
  (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" NOT IN ('WON'::"DealStage", 'LOST'::"DealStage")) AS active_deals,
  (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" NOT IN ('WON'::"DealStage", 'LOST'::"DealStage") AND "createdAt" < ${currentStart}) AS prev_active_deals,
  (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage") AS won_deals_total,
  (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'LOST'::"DealStage") AS lost_deals_total,
  (SELECT COALESCE(SUM("value"), 0)::float FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage") AS total_revenue,
  (SELECT COALESCE(SUM("value"), 0)::float FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage" AND "updatedAt" >= ${currentStart} AND "updatedAt" < ${nextStart}) AS current_period_revenue,
  (SELECT COALESCE(SUM("value"), 0)::float FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage" AND "updatedAt" >= ${previousStart} AND "updatedAt" < ${currentStart}) AS prev_period_revenue,

  -- Lead metrics
  (SELECT COUNT(*)::int FROM "Lead" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL) AS total_leads,
  (SELECT COUNT(*)::int FROM "Lead" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${currentStart} AND "createdAt" < ${nextStart}) AS current_period_leads,
  (SELECT COUNT(*)::int FROM "Lead" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) AS prev_period_leads,

  -- Customer metrics
  (SELECT COUNT(*)::int FROM "Customer" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${currentStart} AND "createdAt" < ${nextStart}) AS current_period_customers,
  (SELECT COUNT(*)::int FROM "Customer" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) AS prev_period_customers,

  -- Task metrics
  (SELECT COUNT(*)::int FROM "Task" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "status" != 'COMPLETED'::"TaskStatus") AS pending_tasks_total,
  (SELECT COUNT(*)::int FROM "Task" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "status" != 'COMPLETED'::"TaskStatus" AND "createdAt" >= ${currentStart} AND "createdAt" < ${nextStart}) AS current_period_pending_tasks,
  (SELECT COUNT(*)::int FROM "Task" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "status" != 'COMPLETED'::"TaskStatus" AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) AS prev_period_pending_tasks
```

### 2. Monthly Won Sales Chart (`monthlySalesRaw`)
Consolidated into a database-level monthly group-by query returning at most 12 scalar rows:
```sql
SELECT
  (EXTRACT(MONTH FROM "updatedAt")::int - 1) AS month_index,
  COALESCE(SUM("value"), 0)::float AS total
FROM "Deal"
WHERE "tenantId" = ${tenantId}
  AND "deletedAt" IS NULL
  AND "stage" = 'WON'::"DealStage"
  AND "updatedAt" >= ${startOfCurrentYear}
GROUP BY (EXTRACT(MONTH FROM "updatedAt")::int - 1)
```

### 3. 7-Day Sparkline Aggregation (`sparklinesRaw`)
Consolidated 3 separate queries (queries 21–23) into 1 single time-series SQL aggregation query returning exactly 7 rows in chronological order:
```sql
SELECT
  d.day_date,
  COALESCE(deals.cnt, 0)::int AS deal_count,
  COALESCE(rev.sum_val, 0)::float AS revenue_sum,
  COALESCE(leads.cnt, 0)::int AS lead_count
FROM (
  SELECT generate_series(${sevenDaysAgo}::date, ${todayStart}::date, '1 day'::interval)::date AS day_date
) d
LEFT JOIN (
  SELECT DATE_TRUNC('day', "createdAt")::date AS dd, COUNT(*) AS cnt
  FROM "Deal"
  WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${sevenDaysAgo}
  GROUP BY DATE_TRUNC('day', "createdAt")::date
) deals ON deals.dd = d.day_date
LEFT JOIN (
  SELECT DATE_TRUNC('day', "updatedAt")::date AS dd, SUM("value") AS sum_val
  FROM "Deal"
  WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage" AND "updatedAt" >= ${sevenDaysAgo}
  GROUP BY DATE_TRUNC('day', "updatedAt")::date
) rev ON rev.dd = d.day_date
LEFT JOIN (
  SELECT DATE_TRUNC('day', "createdAt")::date AS dd, COUNT(*) AS cnt
  FROM "Lead"
  WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${sevenDaysAgo}
  GROUP BY DATE_TRUNC('day', "createdAt")::date
) leads ON leads.dd = d.day_date
ORDER BY d.day_date ASC
```

### 4. Employee Dashboard Metric Counts (`countsRaw`)
Consolidated 5 separate employee metric counts into 1 single query:
```sql
SELECT
  (SELECT COUNT(*)::int FROM "Task" WHERE "tenantId" = ${tenantId} AND "assignedToId" = ${userId} AND "deletedAt" IS NULL AND "status" NOT IN ('COMPLETED'::"TaskStatus", 'CANCELLED'::"TaskStatus")) AS my_pending_tasks,
  (SELECT COUNT(*)::int FROM "Meeting" WHERE "tenantId" = ${tenantId} AND "assignedToId" = ${userId} AND "startTime" >= ${todayStart} AND "startTime" < ${todayEnd}) AS my_today_meetings,
  (SELECT COUNT(*)::int FROM "Meeting" WHERE "tenantId" = ${tenantId} AND "assignedToId" = ${userId} AND "startTime" >= ${now}) AS my_upcoming_meetings,
  (SELECT COUNT(*)::int FROM "Lead" WHERE "tenantId" = ${tenantId} AND "assignedToId" = ${userId} AND "deletedAt" IS NULL) AS my_assigned_leads,
  (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "ownerId" = ${userId} AND "deletedAt" IS NULL AND "stage" NOT IN ('WON'::"DealStage", 'LOST'::"DealStage")) AS my_assigned_deals
```

---

## 5. Queries Intentionally Kept Separate

The following queries were kept separate because each targets a distinct table, uses indexed ordering, and retrieves only a bounded number of lean rows:

1. **Recent Deals** (`tx.deal.findMany(take: 5)`): Fetches 5 most recent deal names and timestamps.
2. **Recent Quotations** (`tx.quotation.findMany(take: 5)`): Fetches 5 most recent quotation client names and timestamps.
3. **Recent Completed Tasks** (`tx.task.findMany(take: 5)`): Fetches 5 most recent completed task titles and timestamps.
4. **Active Revenue Target** (`tx.revenueTarget.findFirst`): Single record lookup on indexed active target.

Forcing these 4 distinct entity types into one heterogeneous SQL UNION or CTE would increase query complexity and hurt maintainability without meaningful performance gains.

---

## 6. Database / SQL Changes

- All SQL statements use Prisma parameterized template literals (`tx.$queryRaw` tag).
- Tenant IDs, timestamps, and stage/status enums are passed as parameterized variables (`$1`, `$2`, etc.), preventing SQL injection.
- Explicit Postgres enum casts (`::"DealStage"`, `::"TaskStatus"`) ensure strict type compatibility with Postgres schema definitions.

---

## 7. Tenant & RBAC Verification

- **Tenant Isolation**: Every subquery and Prisma query enforces `"tenantId" = ${tenantId}` and `"deletedAt" IS NULL`.
- **Tenant Context**: All queries execute within `withTenantContext({ tenantId }, async (tx) => ...)`.
- **Employee Scoping**: `getEmployeeDashboardData` restricts all counts and activity queries to `assignedToId = userId` or `ownerId = userId`.

---

## 8. Before vs After Query Behavior

### `GET /crm/dashboard`

| Metric | Before (Phase 3.6) | After (Phase 3.7) | Change |
|---|---|---|---|
| **Database Queries Executed** | 26 inside tenant context | 7 inside tenant context | **-73% (-19 round-trips)** |
| **Unbounded findMany Queries** | 4 (all won deals, 7-day deals/revenue/leads) | 0 | **100% eliminated** |
| **Max Rows Loaded for Analytics** | Thousands of entity records | Max 19 scalar rows (1 KPI + 12 monthly + 7 daily) | **Drastic reduction** |
| **JS Map/Loop Processing** | 4 date-parsing / looping algorithms | Direct array assignment | **Instant O(1)** |

### `GET /crm/dashboard/employee`

| Metric | Before (Phase 3.6) | After (Phase 3.7) | Change |
|---|---|---|---|
| **Database Queries Executed** | 7 inside tenant context | 3 inside tenant context | **-57% (-4 round-trips)** |

---

## 9. Validation Results

### Automated Backend Tests & Linting
1. **API ESLint**:
   ```bash
   npx eslint src/insights/services/dashboard.service.ts
   # Result: 0 errors, 0 warnings
   ```
2. **API TypeScript Typecheck**:
   ```bash
   npx tsc --noEmit
   # Result: 0 errors
   ```
3. **API Test Suites**:
   ```bash
   npm test
   # Result: 81 test suites passed, 602 tests passed (100% pass rate)
   ```

### Frontend Validation
1. **Web TypeScript Typecheck**:
   ```bash
   npx tsc --noEmit
   # Result: 0 errors
   ```
2. **Web Production Build**:
   ```bash
   npm run build
   # Result: Compiled successfully in 16.9s (53 static/dynamic routes generated cleanly)
   ```

---

## 10. Performance Measurements

- **Query Count Before**: 26 queries in `getDashboardData`, 7 queries in `getEmployeeDashboardData`.
- **Query Count After**: 7 queries in `getDashboardData`, 3 queries in `getEmployeeDashboardData`.
- **Payload & Memory Impact**: Replaced unbounded tenant-wide entity rows with scalar values (numbers/floats).

---

## 11. Files Changed

1. `api/src/insights/services/dashboard.service.ts`
   - Replaced 18 individual counts/sums with 1 consolidated KPI query.
   - Replaced unbounded `findMany` queries with SQL monthly and 7-day sparkline aggregations.
   - Replaced 5 individual employee counts with 1 consolidated query in `getEmployeeDashboardData`.
2. `api/src/prisma/rls-phase3.spec.ts`
   - Updated RLS unit test assertions to verify `$queryRaw` on transaction client `txMock`.

---

## 12. Remaining Limitations

- Real-time Redis caching for aggregated dashboard KPIs across frequent page refreshes can be introduced in future phases if workspace load requires caching beyond database-level execution.
- Dedicated database indexes on `("tenantId", "deletedAt", "createdAt")` and `("tenantId", "stage", "updatedAt")` will be addressed in Phase 3.8 (Database Index Optimization).
