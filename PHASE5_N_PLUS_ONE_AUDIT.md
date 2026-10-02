# Phase 5: N+1 Guardrails Audit

## Summary
The application has undergone significant optimization during Phase 1-4. A review of the codebase was conducted to identify any remaining N+1 query patterns.

## Audit Findings

### 1. `Pipeline Migration` (`validate-phase4.ts`)
- **Status**: SAFE
- **Observation**: Loops over tenants and fetches leads using chunked pagination (`findMany` with `take` and `skip`). It then executes `deal.createMany` with `skipDuplicates: true`. This successfully avoids N+1 queries inside the migration script.

### 2. `CSV Bulk Import`
- **Status**: SAFE
- **Observation**: Implements prefetching and in-memory caching instead of row-by-row database access. (Addressed in previous phases).

### 3. General Prisma Service Usage
- **Status**: SAFE
- **Observation**: The `createSealedAuditLog` uses advisory locks (`pg_advisory_xact_lock`) instead of iterative record fetching to generate the hash chain, maintaining concurrency safety without introducing N+1.

## Guardrail Rules for Future Development
1. **Never use `await prisma...` inside a `for` loop or `Array.map`** when inserting or updating multiple records unless logically strictly required for sequential execution.
2. **Use `createMany`, `updateMany`, and `deleteMany`** for batch operations.
3. **Use `include` or `select`** to fetch related records in a single query instead of fetching them individually in a loop.
4. **When chunking is necessary**, fetch in batches of 100-500 using `cursor` and process the batch in memory before writing back in bulk.
