# Phase 5: Performance Baselines

Based on Phase 1-4 optimizations, here are the established performance baselines and SLA expectations for core endpoints.

| Endpoint | Normal Expected Latency (Warm) | Workload Assumptions | Acceptable Regression Range | Expensive Operations |
|----------|--------------------------------|----------------------|-----------------------------|----------------------|
| `GET /api/auth/me` | < 100ms | High-traffic, hit on every page load | < 150ms | Redis/Supabase auth verification, user retrieval |
| `GET /api/super-admin/dashboard` | ~900ms | Complex aggregations over entire platform | < 1500ms | Group by, Count, JSON aggregation |
| `GET /api/super-admin/navigation` | < 50ms | Basic RBAC / menu items | < 100ms | Role-based permission checks |
| `GET /api/notifications` | < 80ms | Polled frequently | < 120ms | Index seek on `tenantId` + `userId` + `isRead` |
| `POST /crm/pipeline/migrate-leads` | ~2500ms per 1000 records | Idempotent bulk processing | < 5000ms | Multiple batch inserts, duplicate checks |

## Notes
- **Cold vs Warm Distinction**: Serverless environments (if deployed) will experience cold starts which can take 1-3 seconds. These baselines assume a "warm" executing container with an established DB connection pool.
- **Connection Pool**: Latency assumes no active contention/waiting on the DB pool limit (25).
