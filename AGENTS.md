# ClixProCRM — Antigravity Agent Instructions

## 1. PROJECT CONTEXT

ClixProCRM is a production-oriented multi-tenant CRM SaaS.

Repository structure:

- `api/` → NestJS + Fastify + Prisma + PostgreSQL
- `web/` → Next.js + React + Tailwind + shadcn/ui
- PostgreSQL → Supabase
- Redis → BullMQ / rate limiting / distributed infrastructure
- Authentication → Supabase Auth + application authorization
- ORM → Prisma

Primary goals:

1. Correctness
2. Security
3. Performance
4. Maintainability
5. Scalability

Never sacrifice correctness or security just to make code shorter or faster.

---

# 2. EXECUTION SPEED — IMPORTANT

Optimize agent execution for speed.

## Repository scanning

DO NOT scan the entire repository unless the task genuinely requires it.

Before exploring files:

1. Identify the exact feature/module involved.
2. Inspect the directly related files first.
3. Follow imports/references only when necessary.
4. Expand the search scope only if required.

Avoid repeatedly reading unchanged files.

Do not re-open files already inspected unless their contents may have changed.

---

# 3. TASK EXECUTION STRATEGY

For every task use this workflow:

### Step 1 — Locate

Find only the relevant files.

### Step 2 — Inspect

Read the smallest necessary code region.

### Step 3 — Plan

Briefly determine:

- root cause
- affected files
- safest implementation

### Step 4 — Implement

Make the smallest correct change.

### Step 5 — Targeted validation

Run only the validation relevant to the changed area.

### Step 6 — Final validation

Run broader validation only when the task is complete or when explicitly requested.

---

# 4. DO NOT OVER-VALIDATE

Do NOT repeatedly run:

- full test suite
- full TypeScript build
- full production build
- database migrations
- lint across the entire repository

after every tiny change.

Prefer targeted validation.

Examples:

Frontend-only change:

```bash
cd web
npx tsc --noEmit
```
