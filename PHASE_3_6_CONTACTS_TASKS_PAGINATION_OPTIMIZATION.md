# Phase 3.6 — Contacts / Tasks Server-Side Pagination & Filtering Optimization

## 1. Executive Summary

In Phase 3.6, we audited and optimized the data fetching, filtering, sorting, and pagination flows for **Tasks** and **Contacts/Customers**. 

Prior to this phase:
- **Tasks**: The UI hook `useTasksData` invoked `useTasks()` without arguments, pulling a single default page (up to 50 records) into client memory, then ran in-memory JavaScript filtering, sorting, and client-side array slicing (`.slice((page - 1) * limit, page * limit)`). This introduced a critical data correctness bottleneck where tasks existing on pages 2+ were hidden from searches, status filters, and priority filters.
- **Tasks Backend**: The backend `TasksQueryService` already featured a complete, highly optimized raw SQL CTE with parameterized support for `limit`, `offset`, `search`, `status`, `priority`, `sortBy`, `sortOrder`, and strict role-based visibility.
- **Contacts / Customers Backend**: `ContactsService.getCustomers()` previously performed unbounded full-tenant in-memory candidate loading and post-decryption filtering across entire sets. It was upgraded to use the HMAC blind-index candidate search, bounded candidate limits, lean relation selection, and database-level deal filtering.

By connecting `useTasksData` directly to parameterized server queries (`useTasks(queryParams)`), React Query now keys and fetches query-specific pages and counts directly from the backend, completely eliminating JavaScript array slicing and fixing cross-page filtering correctness.

---

## 2. Current Contacts Data Flow

### Architecture
In ClixProCRM, "Contacts" is a polymorphic frontend domain aggregating two distinct CRM entities: **Leads** (`/api/leads`) and **Customers** (`/api/customers`).

```
ContactsPage / ContactsTable
       │
       ▼
useContactsData({ typeFilter, statusFilter, search, sortConfig, currentPage, rowsPerPage })
       ├── if typeFilter includes Lead ──► useLeads() ──► GET /api/leads
       └── if typeFilter includes Customer ──► useCustomers() ──► GET /api/customers
       │
       ▼
Combines & maps leads + customers -> calculates pipeline metrics
```

### Contacts API Service (`api/src/contacts/contacts.service.ts`)
- Serves as the customer query and mutation service for contacts.
- Supports `page`, `limit`, and `search`.
- Standard queries execute direct Prisma `findMany()` with `take`, `skip`, active deal aggregation, and exact tenant isolation (`where: { tenantId, deletedAt: null }`).
- Search queries use HMAC-SHA256 blind index lookups for exact email queries and bounded lean candidate queries (`take: 500`, selective fields) before decrypting name/email/company in memory for substring matching.

---

## 3. Current Tasks Data Flow

### Previous Flow (Before Phase 3.6)
```
TasksPage / TasksTable
       │
       ▼
useTasksData()
       │
       ├── useTasks() (no query params passed!)
       │      │
       │      ▼
       │   GET /api/tasks (returns default page 1: max 50 items)
       │
       ├── JavaScript filteredTasks: Array.filter() on 50 items
       ├── JavaScript sortedTasks: Array.sort() on filtered items
       └── JavaScript paginatedTasks: Array.slice((page-1)*limit, page*limit)
```

### Optimized Flow (After Phase 3.6)
```
TasksPage / TasksTable
       │
       ▼
useTasksData()
       │
       ├── Constructs queryParams: { page, limit, search, status, priority, sortBy, sortOrder }
       │
       ├── useTasks(queryParams)
       │      │
       │      ▼
       │   GET /api/tasks?page=1&limit=10&status=pending&search=call&sortBy=dueDate&sortOrder=asc
       │      │
       │      ▼
       │   TasksQueryService.getTasks() (Raw SQL CTE with WHERE, COUNT, ORDER BY, LIMIT/OFFSET)
       │      │
       │      ▼
       │   Returns { tasks: [...10 items...], pagination: { total, totalPages, page, limit } }
       │
       └── Direct state consumption (filteredTasks = safeTasks, paginatedTasks = safeTasks)
```

---

## 4. Bottlenecks Actually Verified

| Component | Verified Bottleneck | Impact | Resolution |
| :--- | :--- | :--- | :--- |
| `web/features/tasks/hooks/use-tasks-data.ts` | **Client-side slicing & filtering on partial dataset**: Called `useTasks()` without params. Filtered and sliced in memory over the default 50 records. | Missing results: Search or filter criteria matching tasks beyond record 50 were never returned to user. | Passed `queryParams` (`page`, `limit`, `search`, `status`, `priority`, `sortBy`, `sortOrder`) to `useTasks()`. |
| `web/features/tasks/hooks/use-tasks-data.ts` | **Duplicate local state & array sorting**: Maintained separate duplicate arrays (`safeTasks`, `filteredTasks`, `paginatedTasks`) recalculating in every render. | Unnecessary React computation and memory overhead. | Streamlined hook to directly consume server-returned paginated tasks. |
| `api/src/contacts/contacts.service.ts` | **Unbounded customer decryption on search**: Search loaded all customer records and all deal relations across the workspace. | Potential memory/CPU spike on large customer datasets. | Upgraded search to use HMAC blind indexing and bounded lean candidate queries with DB-level active deal filtering. |

---

## 5. Implementation Details

### 1. `web/features/tasks/hooks/use-tasks-data.ts`
- Added memoized `queryParams` construction responding to `currentPage`, `rowsPerPage`, `search`, `statusFilter`, `priorityFilter`, and `sortConfig`.
- Passed `queryParams` into `useTasks(queryParams)`.
- Reset `currentPage` to `1` automatically inside `setSearch`, `setStatusFilter`, `setPriorityFilter`, `setRowsPerPage`, and `handleClearFilters`.
- Replaced client-side slicing with server metadata:
  ```typescript
  const filteredTasks = safeTasks;
  const paginatedTasks = safeTasks;
  const totalTasks = data?.pagination?.total ?? safeTasks.length;
  const totalPages = data?.pagination?.totalPages ?? Math.max(1, Math.ceil(totalTasks / rowsPerPage));
  ```

### 2. `api/src/contacts/contacts.service.ts`
- Applied HMAC-SHA256 blind indexing for exact email searches.
- Constrained candidate search projection to `take: 500` with lean fields (`id`, `name`, `email`, `company`, `status`, `phone`, `createdAt`, `updatedAt`, `leadId`, `companyId`).
- Filtered deals directly at the database level (`deals: { where: { stage: { not: 'LOST' } } }`).

---

## 6. Server-Side Pagination / Filtering Flow

The server-side flow adheres strictly to database best practices:

```
Request Parameters (page, limit, search, status, priority, sortBy, sortOrder)
                               │
                               ▼
            SQL WHERE (tenantId, status, priority, RBAC, ILIKE search)
                               │
                               ▼
        ┌──────────────────────┴──────────────────────┐
        ▼                                             ▼
  COUNT(*) OVER()                               ORDER BY & LIMIT / OFFSET
        │                                             │
        └──────────────────────┬──────────────────────┘
                               │
                               ▼
      JSON Response: { tasks, pagination: { total, totalPages, page, limit } }
```

---

## 7. React Query Changes

- `useTasks(params)` internally uses `['tasks', params]` as the React Query query key.
- Changing `currentPage`, `search`, `statusFilter`, `priorityFilter`, or sorting now produces a unique, stable query key that caches results per parameter set and fetches fresh server pages seamlessly.
- Stale query results are avoided, and fast back-and-forth page navigation is cached automatically by React Query.

---

## 8. Security & Tenant Isolation Verification

- **Tenant Isolation**: Every SQL query and Prisma query enforces `tenant_id = :tenantId` / `tenantId: tenantId`.
- **Soft Deletion**: `deleted_at IS NULL` / `deletedAt: null` is strictly enforced.
- **RBAC Visibility**: `TasksQueryService` continues to enforce role-based row visibility:
  - `ADMIN` / `SUPER_ADMIN` / `MANAGER`: Access to all workspace tasks.
  - `USER`: Restricted to tasks where `assigned_to = :userId` OR `created_by = :userId`.
- **AES-256 Decryption**: Handled securely on the server with bounded candidate sets.

---

## 9. Validation Results

### Automated Tests & Linting
1. **API ESLint**:
   ```bash
   npx eslint src/contacts/contacts.service.ts
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
4. **Web TypeScript Typecheck**:
   ```bash
   npx tsc --noEmit
   # Result: 0 errors
   ```
5. **Web Production Build**:
   ```bash
   npm run build
   # Result: Compiled successfully in 18.7s, 53 static/dynamic routes generated cleanly
   ```

---

## 10. Before vs After Request Behavior

### Tasks
- **Before**:
  - Endpoint: `GET /api/tasks` (no parameters)
  - Requested dataset: Default page 1 (50 tasks max)
  - Client-side processing: Filtered and sliced in JS; cross-page search was broken for tasks outside the first 50.
- **After**:
  - Endpoint: `GET /api/tasks?page=1&limit=10&status=pending&priority=high&search=contract`
  - Requested dataset: Exactly 10 matching tasks
  - Client-side processing: 0 filtering or slicing; full server-side accuracy across the entire workspace task dataset.

### Contacts (Customers Service)
- **Before**:
  - Endpoint: `GET /api/customers?search=test`
  - Backend processing: Unbounded `findMany()` across all tenant customers with all deal relations, decrypted in memory.
- **After**:
  - Endpoint: `GET /api/customers?search=test`
  - Backend processing: Blind index fast-path or bounded candidate search (max 500) with lean fields and DB-filtered deals.

---

## 11. Files Changed

1. `web/features/tasks/hooks/use-tasks-data.ts`
   - Connected `useTasks(queryParams)` to server parameters.
   - Removed client-side slicing and array filtering.
   - Tied pagination navigation and counts directly to server `pagination` metadata.
2. `api/src/contacts/contacts.service.ts`
   - Added blind index email matching.
   - Bounded candidate search loading to lean projections.
   - Shifted active deal filtering to the database query.

---

## 12. Remaining Limitations

- Polymorphic Contacts aggregation (`web/features/contacts/hooks/use-contacts-data.ts`) combines separate `/api/leads` and `/api/customers` endpoints on the client. Unifying Leads and Customers into a single polymorphic server-side `/api/contacts` endpoint with unified database-level pagination would require significant architectural and API contract changes, which is outside the scope of this non-breaking performance optimization phase.
- Database index optimization on task search/status columns is deferred to Phase 3.8 (Database Index Optimization).
