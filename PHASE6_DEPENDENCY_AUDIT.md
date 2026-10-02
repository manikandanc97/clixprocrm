# PHASE 6 - STAGE 5: DEPENDENCY AUDIT

## METHODOLOGY
We analyzed `web/package.json` and `api/package.json` using `depcheck` and manual inspection of the codebase to identify unused, redundant, or overly large dependencies.

## WEB APPLICATION

**Production Dependencies**
- **Analysis:** Clean. No unused production dependencies were found.
- **Notes:** 
  - `tw-animate-css` was flagged by scanners but is actively used in `globals.css` (`@import "tw-animate-css";`).
  - `xlsx`, `papaparse`, `recharts`, and `@dnd-kit/core` are large but actively used in specific routes (Leads, Deals, Reports). They are already properly code-split via Next.js dynamic imports, so they do not bloat the initial `main` chunk.

**Dev Dependencies**
- **Analysis:** Scanners flagged `@tailwindcss/postcss` and `tailwindcss`, which are required by the Tailwind CSS v4 setup. `cross-env` was used by us during the analysis build.

## API APPLICATION

**Production Dependencies**
- **Analysis:** Clean. All production dependencies (NestJS core, Prisma, Supabase, BullMQ, etc.) are actively utilized.

**Dev Dependencies**
- **Analysis:** Scanners flagged `@nestjs/schematics`, `@types/jest`, and `tsconfig-paths`. 
- **Notes:** These are false positives. `@nestjs/schematics` is required for Nest CLI generators, and `tsconfig-paths` is required for resolving `@/` aliases during local testing/builds.

## CONCLUSION
**No dependencies are safe to remove at this time.** The repository is free from orphaned production dependencies. Dependency-based performance issues in the web app are entirely due to *how* (client boundaries) and *when* (eager vs lazy) dependencies are loaded, not the presence of unused dependencies.
