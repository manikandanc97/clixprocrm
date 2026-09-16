# Phase 3.2 — Customer Search Performance Optimization Report

## 1. Root Cause
In `CustomersService.getCustomers()` (`api/src/customers/customers.service.ts`), when a `search` query parameter was passed:
1. **Unbounded Full-Tenant Fetch**: `tx.customer.findMany({ where })` executed without `skip` or `take` clauses, querying every customer record in the tenant.
2. **Deal Relation Bloat**: For every customer in the entire tenant, all associated deals were retrieved without DB-level stage filtering.
3. **Mass In-Memory Decryption**: AES-256-GCM decryption was executed on three fields (`name`, `company`, `email`) for all records across the entire tenant workspace.
4. **Premature Deal Aggregation**: Deals revenue was filtered and summed in Node.js for every customer across the workspace before filtering out 99%+ of records that did not match the search term.
5. **In-Memory JavaScript Slicing**: Pagination (`slice(skip, skip + limit)`) was performed strictly in JavaScript after full decryption and aggregation.

---

## 2. Existing Search Behavior
- **Search Term Format**: Trimmed string search (`search.trim()`).
- **Search Scope**: Multi-field case-insensitive substring match against decrypted `name`, `company`, and `email`.
- **Search Execution**:
  - Non-search query: Handled via DB pagination (`skip`, `take`, `count()`).
  - Search query: Handled in Node memory across all customer records.

---

## 3. Encryption / Search Constraints
- **AES-256-GCM with Random 12-byte IV**: `Customer.name`, `Customer.company`, and `Customer.email` are encrypted using non-deterministic AES-256-GCM. Identical plaintext values result in completely distinct ciphertexts with unique authentication tags. Therefore, PostgreSQL `ILIKE` or trigram indexes cannot be run directly on ciphertext columns without exposing plaintext or breaking zero-knowledge data security.
- **HMAC-SHA256 Blind Index**: The `Customer.emailHash` column stores a deterministic HMAC-SHA256 hash of normalized email addresses, indexed via `@@index([tenantId, emailHash])`.
- **Security Invariants Preserved**:
  - Zero plaintext exposure to PostgreSQL or logs.
  - No alteration or weakening of AES-256-GCM encryption keys or modes.
  - No plaintext logging during decryption.

---

## 4. Changes Made
Optimized `CustomersService.getCustomers()` in [api/src/customers/customers.service.ts](file:///d:/Projects/project/clixprocrm/api/src/customers/customers.service.ts):
1. **Fast-Path Blind Index Email Search**:
   - If `search` contains `@`, the service computes `this.enc.hash(searchTrimmed)` and queries `tx.customer.findMany` with `where: { tenantId, emailHash, deletedAt: null }` using SQL-level `skip`, `take`, and `count()`.
   - Utilizes existing database index `Customer_tenantId_emailHash_idx`.
   - Bypasses full candidate scanning completely when email matches.
2. **Lean Candidate Projection for Substring Search**:
   - For general substring search (names, companies), retrieves candidate records using explicit `select` projection with only required fields.
   - Pushes deal stage filtering to PostgreSQL: `deals: { where: { stage: { not: 'LOST' } }, select: { value: true, stage: true } }` and `_count: { select: { deals: { where: { status: { not: 'LOST' } } } } }`.
3. **Single-Pass In-Memory String Matching**:
   - Scans candidates in a single pass decrypting `name`, `company`, `email` and tests case-insensitive substring matches.
   - Defers deal revenue reduction and mapping until AFTER pagination slicing (`paginatedSlice = matchedCustomers.slice(skip, skip + limit)`), computing deal aggregations only for the 10 displayed rows.
4. **Fast-Path Default View (No Search)**:
   - Preserved SQL-level pagination with filtered deal relation loading.
5. **Type Safety Cleanup**:
   - Fixed TypeScript types in `updateCustomer` and candidate mappings to ensure strict compile without `any`.

---

## 5. Query Strategy
```
+-------------------------------------------------------------+
|               CustomersService.getCustomers                 |
+-------------------------------------------------------------+
                               |
               +---------------+---------------+
               |                               |
       [ search.trim() != "" ]         [ search.trim() == "" ]
               |                               |
        +------+------+                        |
        |             |                        v
  [ Contains @ ]  [ Text Search ]      SQL-level Pagination:
        |             |                - skip, take (limit=10)
        v             v                - deals stage != 'LOST'
  Blind Index     Candidate Scan:      - count(where)
  Exact Lookup:   - Lean select        - Decrypt only 10 rows
  - emailHash     - Push deal filter   
  - SQL skip/take - Match name/company 
  - count(where)  - Slice page (10)    
                  - Aggregate 10 rows  
```

---

## 6. Pagination Behavior
- **Contract Maintained**:
  - `page`: 1-indexed, bounded `Math.max(1, page)`.
  - `limit`: Bounded `Math.max(1, Math.min(limit, 10000))`.
  - `skip`: `(page - 1) * limit`.
  - `total`: Exact count of matched items.
  - `totalPages`: `Math.ceil(total / limit)`.
- **Response Structure**:
  ```json
  {
    "customers": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
  ```

---

## 7. Relation Loading Changes
- **Before**: `deals: true` (loaded all deal columns including lost deals across all tenant customers).
- **After**:
  - SQL stage filtering applied directly in Prisma relation: `where: { stage: { not: 'LOST' } }`.
  - Select projected to only required aggregation columns: `select: { value: true, stage: true }`.
  - Deal revenue reduction computed only on the sliced page items ($O(\text{page\_limit})$ instead of $O(N \cdot D)$).

---

## 8. Tenant / RBAC Verification
- **Tenant Isolation**:
  - `where: { tenantId, deletedAt: null }` enforced across all Prisma queries.
  - `withTenantContext({ tenantId }, tx => ...)` sets PostgreSQL session variable `app.current_tenant_id` for RLS.
  - Blind index email search preserves `{ tenantId, emailHash, deletedAt: null }`.
- **RBAC**: Handled by existing NestJS `RolesGuard` / `PermissionsGuard` in [customers.controller.ts](file:///d:/Projects/project/clixprocrm/api/src/customers/customers.controller.ts) (`@RequirePermission(Permission.VIEW_CUSTOMERS)`).

---

## 9. API Compatibility Verification
- **Endpoint**: `GET /api/customers?page=1&limit=10&search=...`
- **Output Properties Per Customer**:
  - `id`, `tenantId`, `name`, `email`, `company`, `status`, `revenue`, `revenueValue`, `dealsCount`, `lastContactAt`, `assignedToId`, `leadId`, `companyId`, `teamId`, `branchId`, `createdAt`, `updatedAt`, `deletedAt`, `deals`, `_count`.
- All fields match frontend expectations from `useCustomers` hook and [customer list table](file:///d:/Projects/project/clixprocrm/web/src/pages/customers/CustomerList.tsx).

---

## 10. Tests and Build Results
- **ESLint**:
  - Command: `npx eslint src/customers/customers.service.ts`
  - Result: 0 errors, 0 warnings.
- **TypeScript Compilation**:
  - Command: `npx tsc --noEmit`
  - Result: 0 errors (Exit code 0).
- **Test Suite**:
  - Command: `npm test`
  - Result: 81 passed out of 81 test suites (602 passed, 0 failed).

---

## 11. Remaining DB / Index Opportunities
- For exact company or exact name lookups in future phases: add deterministic HMAC-SHA256 blind indexes (`nameHash`, `companyHash`) with `@@index([tenantId, nameHash])` and `@@index([tenantId, companyHash])` via a dedicated Prisma migration.
- Add composite index `@@index([tenantId, deletedAt, createdAt(sort: Desc)])` for optimal customer list sorting under high concurrency.

---

## 12. Before / After Complexity

| Metric / Operation | Before Optimization | After Optimization |
| :--- | :--- | :--- |
| **Email Search Query** | $O(N)$ full tenant scan + $N$ decryptions | $O(1)$ B-tree index lookup via `emailHash` + 10 decryptions |
| **Email Search DB Payload** | All customers $\times$ all deals in tenant | 10 customers $\times$ active deals |
| **Substring Search Candidate Payload** | Full objects + all unpruned deal records | Lean selected fields + stage-filtered deals |
| **Deal Revenue Reduction** | $O(N \cdot D)$ across entire tenant | $O(\text{page\_limit} \cdot D)$ (10 records only) |
| **Non-Search List Query** | $O(\text{page\_limit})$ with unpruned deals | $O(\text{page\_limit})$ with stage-filtered deals |

---

## 13. Known Limitations
- General substring search (e.g. searching "acme" in company name) on non-email fields must decrypt candidate records in Node memory due to non-deterministic AES-256-GCM ciphertexts. Full SQL substring indexing on encrypted text would require order-revealing/searchable symmetric encryption (SSE) or deterministic searchable n-grams, which is not part of the current schema. However, candidate payloads and deal processing overhead have been minimized.
