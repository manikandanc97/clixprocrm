# ClixProCRM Phase 3.1: P0 Pipeline Performance Optimization Report

## 1. Root Cause
In `api/src/deals/services/pipeline.service.ts`, the `getPipeline(tenantId)` handler exhibited severe algorithmic and query-path performance bottlenecks:
1. **Unbounded Multi-Pass Iterations**: The handler ran $25+$ independent array iterations and filtering operations across all retrieved workspace deals (`.filter()`, `.reduce()`, `.map()`).
2. **$O(28N)$ Sparkline Processing**: Calculating the 7-day sparklines (`sparklineActiveDeals` and `sparklineWinRate`) iterated through the entire deals array $21$ times ($7\text{ days} \times 3\text{ filters}$), instantiating Date objects and string comparisons on every tick.
3. **Inefficient Metric Extraction**: Open deals, won deals, weighted values, and baseline comparison trends were all calculated via distinct array scans rather than a consolidated single-pass aggregation.

---

## 2. Existing Behavior
- Endpoint: `GET /crm/pipeline`
- Controller: `PipelineController.getPipeline()`
- Consumers:
  - `web/app/(dashboard)/deals/page.tsx`
  - `web/features/pipeline/components/PipelineBoard.tsx`
  - `web/features/dashboard/components/DashboardKPIs.tsx`
- Response Payload Structure:
  ```json
  {
    "stats": [
      { "title": "Total Value", "value": "$10,000", "valueAmount": 10000 },
      { "title": "Weighted Value", "value": "$5,000", "valueAmount": 5000 },
      { "title": "Active Deals", "value": "12 Deals", "valueAmount": 12, "sparklineData": [...], "change": "+5.0%", "trend": "up" },
      { "title": "Win Rate", "value": "65%", "valueAmount": 65, "sparklineData": [...], "change": "+2.0%", "trend": "up" }
    ],
    "items": [
      {
        "id": "deal-uuid",
        "name": "Deal Name",
        "company": "Company Name",
        "value": "$5,000",
        "valueAmount": 5000,
        "followUp": "In 3 days",
        "followUpAt": "2026-09-20T00:00:00.000Z",
        "stage": "QUALIFIED",
        "priority": "Medium",
        "probability": 40,
        "temperature": "Hot",
        "expectedCloseDate": "20 Sep 2026",
        "activityCount": 3,
        "isStuck": false,
        "aiSummary": "...",
        "createdAt": "2026-09-10T12:00:00.000Z"
      }
    ]
  }
  ```

---

## 3. Changes Made
Modified **only** `api/src/deals/services/pipeline.service.ts`:
- Replaced the $25+$ multi-pass filtering and reducing routines with a **single unified $O(N)$ pass** that simultaneously computes:
  1. Current pipeline metrics (`openDealsCount`, `wonDealsCount`, `totalValue`, `weightedPipeline`).
  2. 7-day-ago baseline metrics for exact trend calculation (`prevOpenDeals`, `prevTotalDeals`, `prevWonDeals`).
  3. Precomputed 7-day sparkline buckets (`dEndTimes[0..6]`) for daily active deal and conversion rate tracking.
  4. Item transformation, relative follow-up formatting, temperature/stuck heuristics, and AES-256-GCM PII decryption.

---

## 4. Query Strategy
- Kept inside `this.prisma.withTenantContext({ tenantId }, async (tx) => { ... })` to strictly enforce multi-tenant Row-Level Security (RLS) isolation.
- Maintained targeted `select` projections:
  ```ts
  select: {
    id: true,
    name: true,
    value: true,
    stage: true,
    probability: true,
    expectedCloseDate: true,
    createdAt: true,
    updatedAt: true,
    company: { select: { name: true } },
    customer: { select: { name: true } },
  }
  ```
- Excluded unneeded relations and fields (`tasks`, `meetings`, `quotations`, `invoices`, `timelineEvents`, `emailThreads`, `description`, `lostReason`, `source`).

---

## 5. Sparkline Optimization
- **Before**: 7 iterations over the array, running 3 `.filter()` passes per day:
  $$\text{Complexity} = 7 \times 3 \times N = 21N\text{ iterations}$$
- **After**: Fixed daily timestamp boundaries (`dEndTimes[0..6]`) are evaluated inside the single loop over deals:
  $$\text{Complexity} = 1 \times N\text{ iterations with } 7\text{ integer timestamp comparisons}$$
- **Semantics Preserved**: The daily active count and daily conversion rate percentages match the exact business logic of the existing contract.

---

## 6. Security & Tenant Verification
- **Tenant Context**: All queries execute within `withTenantContext({ tenantId })` setting session variable `app.current_tenant_id = tenantId`.
- **Tenant Isolation**: Soft-deleted records (`deletedAt: null`) and cross-tenant leakage prevention verified by automated RLS test suite (`core-crm-rls-phase2.spec.ts`).
- **PII Encryption**: Only the required `company.name` and `customer.name` fields are decrypted for active records during item assembly.

---

## 7. API Compatibility Verification
- **Response Shape**: 100% identical. `stats` and `items` structures have exact field names, types, and sparkline payload shapes.
- **Sorting**: Retains `orderBy: [{ stage: 'asc' }, { updatedAt: 'desc' }]`.
- **Pipeline Stages**: All enum stages (`NEW`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`) and temperatures (`Hot`, `Warm`, `Cold`) operate with identical rules.

---

## 8. Tests & Build Results
- **TypeScript Typecheck (`npx tsc --noEmit`)**: Passed (0 errors).
- **ESLint (`npx eslint src/deals/services/pipeline.service.ts`)**: Passed (0 errors, 0 warnings).
- **Full Backend Test Suite (`npm test`)**: 81/81 test suites passed, 602/602 tests passed.
- **Prisma RLS Test Suite (`src/prisma/core-crm-rls-phase2.spec.ts`)**: Passed.

---

## 9. Remaining DB / Index Opportunities (For Index Migration Phase)
- `Deal` table has `@@index([tenantId, deletedAt])`, `@@index([tenantId, stage])`, and `@@index([tenantId, deletedAt, stage, updatedAt])`.
- In a future database phase, adding `@@index([tenantId, deletedAt, stage, createdAt])` will further accelerate date-bounded aggregation.

---

## 10. Before / After Complexity Comparison

| Metric | Before Optimization | After Optimization (Phase 3.1) |
|---|---|---|
| **Array Passes** | $25+$ full array passes (`filter`, `reduce`, `map`) | **1 single pass ($O(N)$)** |
| **Sparkline Operations** | $21N$ Date conversions & filtering | **$7$ integer timestamp comparisons in main loop** |
| **Relation Decryption** | Scattered across multiple callbacks | **Consolidated in single item mapping loop** |
| **API Contract Drift** | Baseline | **0% drift (100% backwards compatible)** |
| **Test Suite Status** | 602 passed | **602 passed (100%)** |
