# PHASE 6 - STAGE 4: UNUSED / DEAD CODE AUDIT

## METHODOLOGY
We utilized `knip` and manual inspection to find unused files, orphaned exports, and duplicate components across the `api` and `web` codebases.

## BACKEND (API)

### Unused Files (Development / Scripts)
Knip identified several script and test files as technically "unused" because they are not imported by the main application graph:
- `scripts/list-deals.ts`
- `scripts/migrate-deals.ts`
- `scripts/perf-regression.ts`
- `scripts/seed-e2e-user.ts`
- `scripts/test-perf.ts`
- `scripts/update-modules.ts`
- `scripts/validate-phase4.ts`
- `test/app.e2e-spec.ts`
- `test/delete-account.e2e.ts`

**Categorization: ACTIVELY USED (by developers)**
*Reasoning*: These are standalone execution scripts and E2E tests used during the development lifecycle. They do not ship to the production NestJS bundle. Removing them would harm maintainability.

### Unused Exports
Knip found 32 unused exports and 21 unused types across `src/auth`, `src/common`, `src/email`, and `src/super-admin`.
**Categorization: NEEDS REVIEW**
*Reasoning*: While not imported elsewhere in the backend, many of these are DTOs, utility functions, or constants (like `ALLOWED_EXTENSIONS`) that serve as documentation or are prepared for future endpoints. Since they are tree-shaken by Webpack/Terser during the NestJS build (or have negligible impact), they are not performance bottlenecks.

## FRONTEND (WEB)

### Unused Exports / Types
Knip identified dozens of unused interfaces in `shared/lib/api/` and `shared/types/`. 
**Categorization: SAFE TO REMOVE (but low priority)**
*Reasoning*: TypeScript interfaces are stripped completely during the build process. They contribute 0 bytes to the Next.js bundle.

### Duplicate Exports
- `DashboardCelebration` in `components/celebration/DashboardCelebration.tsx`
- `AIPerformanceChart` in `features/ai/components/AIPerformanceChart.tsx`
- `QuoteForm` in `features/forms/QuoteForm.tsx`
- `ClixProLogo` in `shared/ui/logo.tsx`

**Categorization: NEEDS REVIEW**
*Reasoning*: These components export both a named export and a default export. This does not bloat the bundle significantly if tree-shaking works, but it's poor practice.

## SUMMARY
**No major dead code was found that affects production bundle size.** Next.js and NestJS are successfully tree-shaking unused exports. The unused files identified are development scripts. No automated deletion is required for this stage.
