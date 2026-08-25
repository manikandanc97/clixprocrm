-- 1. Safely demote non-canonical Super Admins while preserving their accounts, organization memberships, and CRM data
UPDATE "User"
SET "isSuperAdmin" = false
WHERE "isSuperAdmin" = true
  AND LOWER("email") NOT IN (
    LOWER(COALESCE(current_setting('app.canonical_super_admin_email', true), 'superadmin@clixprocrm.com'))
  );

-- 2. Synchronize Supabase Auth raw_user_meta_data for the demoted users if auth.users table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{isSuperAdmin}',
      'false'::jsonb
    )
    WHERE LOWER(email) IN ('gowthamdeveloper94@gmail.com', 'manibct1817@gmail.com');

    -- Ensure canonical Super Admin metadata has isSuperAdmin: true
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{isSuperAdmin}',
      'true'::jsonb
    )
    WHERE LOWER(email) = 'superadmin@clixprocrm.com';
  END IF;
END $$;

-- 3. Create Partial Unique Index enforcing at most ONE active Super Admin in the PostgreSQL database
CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_super_admin"
ON "User" ("isSuperAdmin")
WHERE "isSuperAdmin" = true
  AND "status" = 'ACTIVE'
  AND "deletedAt" IS NULL;
