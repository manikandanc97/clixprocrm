# Phase 5: Existing Observability Inventory

## API (NestJS + Prisma)
- **Logger**: Uses NestJS standard `Logger` class across services for explicit logging of events (e.g., `PrismaService`, `Bootstrap`).
- **Context**: Request-scoped `TenantContextService` ensures isolation using PostgreSQL session variables (`app.current_tenant_id`).
- **Middleware/Interceptors**: 
  - Did not previously have a global HTTP timing interceptor (added in Step 2).
  - Uses a `tenant-context.middleware.ts` for parsing `X-Tenant-Id`.
- **Database (Prisma)**: 
  - Extensively uses `$transaction` and a custom `createSealedAuditLog` for business-level audit trails. 
  - Re-connection and backoff are built into `onModuleInit`.
- **Performance Testing**: Has basic `scripts/test-perf.ts` and `scripts/validate-phase4.ts`.

## Web (Next.js + React Query)
- **Data Fetching (React Query)**:
  - Configured centrally in `web/app/providers.tsx`.
  - Default `staleTime` is set to `2 * 60 * 1000` (2 minutes).
  - `refetchOnWindowFocus` is set to `false` to prevent noise-driven refetches.
- **API Client (Axios)**:
  - `client.ts` includes an interceptor for injecting tokens and handling 401/403.
  - Implements GET request deduplication for concurrent identical requests (`inFlightGetRequests`).

## Conclusion
The infrastructure has a solid foundation in error logging and tenant audit logs. What was missing was automatic request timing, slow database query logging, and documented baseline performance guarantees.
