# FINAL PRODUCTION DEPLOYMENT RUNBOOK

## 1. Before Deployment
- **Backup Verification:** Verify a full database backup and ensure PITR (Point-in-Time Recovery) is active via the Supabase Dashboard.
- **Environment Verification:** Confirm `api/.env.production` and Vercel production environment variables map correctly without exposing secrets.
- **Migration Verification:** Ensure `npx prisma migrate status` identifies pending migrations accurately.
- **Deployment Approval:** Ensure all Staging tests (when available) have passed.
- **Rollback Plan:** Confirm that prior container images or Vercel deployments can be reverted within 5 minutes if issues arise.

## 2. Database
- **Migration Command:** Run `npx prisma migrate deploy` ONLY after establishing the pre-deployment backup.
- **Migration Verification:** Run `npx prisma migrate status` to confirm all migrations are successfully applied.
- **Health Check:** Ensure database responds to basic queries or API health checks.
- **Migration `20260916173000_phase3_8_database_index_optimization` Analysis:** This pending migration is safe. It only performs `CREATE INDEX IF NOT EXISTS` for read-heavy operations on `Task`, `Quotation`, `Meeting`, and `Company`. It does not drop tables or columns, and does not perform destructive data mutations. **Expected duration:** < 10 seconds. **Expected locks:** Standard index creation locks (non-concurrent). **Rollback:** Safe to drop indexes manually if performance degrades, though highly unlikely.

## 3. Backend
- **Deploy:** Trigger container build/deployment on production host (AWS/Render/Railway) using `npm run build` and `npm run start:prod`.
- **Health Check:** Hit the `/api/health` endpoint and verify a `200 OK` response.
- **Logs:** Monitor startup logs to ensure `SecurityConfigValidator` passes and no uncaught exceptions or database connection errors occur.

## 4. Frontend
- **Deploy:** Trigger production build on Vercel. Ensure the build command `npm run build` exits with code 0.
- **Browser Verification:** Open `https://app.clixprocrm.com` and ensure static assets, CSS, and JS chunks load without 404s or hydration errors.

## 5. Authentication
- **Login:** Attempt login using valid production credentials.
- **Logout:** Verify session is successfully destroyed and user is redirected.
- **Callback Verification:** Test password reset and magic link flows to ensure callbacks correctly route to the production domain.

## 6. Smoke Test (Critical Workflows)
Perform brief manual verification of the following modules to ensure core connectivity and RBAC are intact:
- Dashboard (Loads without 500s)
- Leads (Data renders correctly)
- Customers (Tenant isolation respected)
- Deals / Pipeline (Drag and drop/update functions properly)
- Tasks (Read/Write succeeds)
- Notifications (Real-time updates or fetch succeeds)

## 7. Monitoring
- **Logs:** Monitor Vercel and Backend log streams for the first 15 minutes post-deployment for 5xx errors.
- **Errors:** Check Sentry or configured error tracking platform for new regression alerts.
- **Performance:** Verify latency for `/api/auth/me` and dashboard endpoints against established baselines.
- **Uptime:** Ensure uptime monitors (e.g., BetterStack, Datadog) report all green.

## 8. Rollback
- **Frontend:** Use Vercel's "Instant Rollback" feature to revert to the previous known-good deployment.
- **Backend:** Re-deploy the previously tagged Docker image or use the host's rollback capability.
- **Database Considerations:** Additive migrations (like indexes) do not strictly require rollback if the application reverts. For schema-breaking changes, restore from the pre-deployment PITR backup if downward migration is unsafe.
