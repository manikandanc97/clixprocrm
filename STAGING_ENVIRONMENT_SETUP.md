# STAGING ENVIRONMENT SETUP

## Overview
This document defines the minimum required structure and configuration to achieve a true, isolated Staging environment for ClixProCRM. **Currently, a Staging Database is NOT CONFIGURED via automated scripts, and must be provisioned manually.**

**CRITICAL RULE:** The Staging environment must NEVER share a database, storage bucket, or authentication project with the Production environment.

## 1. Staging Database Requirement
**Status:** STAGING DATABASE: NOT CONFIGURED

**Manual Provisioning Steps:**
1. Create a new, isolated PostgreSQL database (e.g., a new Supabase Project named "ClixProCRM-Staging").
2. Ensure this database does NOT contain production customer/user PII. Use synthetic data for testing.
3. Obtain the connection strings (Transaction Pooler URL and Direct Connection URL) for this new database.

## 2. Staging Authentication
Staging authentication must use the isolated Supabase Staging Project.

**Required Configuration (in the Staging Supabase Project):**
- **Site URL:** The staging frontend URL (e.g., `https://staging.clixprocrm.com`)
- **Redirect URLs:** Add `https://staging.clixprocrm.com/api/auth/callback` and `https://staging.clixprocrm.com/reset-password`.
- **Email Templates:** Ensure email verification and password reset URLs point to the staging frontend URL.

## 3. Staging Storage
**Preferred Setup:** Use a separate staging storage bucket within the staging Supabase project. 
- Ensure staging files cannot access production customer files. 
- Apply the same RLS access policies to the staging bucket as the production bucket.

## 4. Staging Email
**Test Email Strategy:**
- Configure the staging environment to use an email sandbox (e.g., SendGrid Sandbox Mode) or a test provider.
- Set a strict recipient allowlist to ensure no staging test emails are ever sent to real production customers.

## 5. Environment Matrix

| Component | Development | Staging | Production |
|---|---|---|---|
| **Frontend** | Local Next.js Server (`http://localhost:3000`) | Vercel Preview/Staging Branch | Vercel Production Environment |
| **Backend** | Local NestJS Server (`http://localhost:4000/api`) | Separate Render/Railway App | Production Render/Railway App |
| **Database** | Local Postgres / Supabase Dev | Isolated Staging Supabase Project | Production Supabase Project |
| **Auth** | Supabase Dev Project | Isolated Staging Supabase Project | Production Supabase Project |
| **Storage** | Local Supabase Storage | Staging Supabase Storage Bucket | Production Supabase Storage Bucket |
| **Email** | Console Logger / LocalSMTP | Sandbox/Test Mode Email Provider | Production SendGrid/Postmark |
| **API URL** | `http://localhost:4000/api` | `https://staging-api.clixprocrm.com/api` (Placeholder) | `https://api.clixprocrm.com/api` |
| **Domain** | `http://localhost:3000` | `https://staging.clixprocrm.com` (Placeholder) | `https://app.clixprocrm.com` |

## 6. Environment Templates
Safe placeholder templates have been created in the repository:
- `web/.env.staging.example`
- `api/.env.staging.example`

These files contain variable names only. Actual credentials must be configured directly within the deployment platform (e.g., Vercel, Render) and never committed to source control.
