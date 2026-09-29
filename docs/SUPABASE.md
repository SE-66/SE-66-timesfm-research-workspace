# Supabase Setup

## Feature scope

Supabase persists only app-owned research-log metadata. It does not run TimesFM and does not receive CSV files uploaded inside the Hugging Face iframe.

## 1. Create/select a project

Use a Supabase project appropriate for the research environment. Record the project URL and publishable key.

## 2. Enable Anonymous Sign-Ins

Enable anonymous authentication in the Supabase Auth settings. This allows the application to create an authenticated user without an email/password UI.

Anonymous users receive the `authenticated` Postgres role and are isolated by RLS. Their browser session is not recoverable after clearing browser storage unless the account is later linked to a permanent identity.

## 3. Apply the SQL migration

Apply:

`supabase/migrations/202609290001_create_research_entries.sql`

The migration:

- creates `public.research_entries`;
- enables RLS;
- revokes table access from unauthenticated `anon`;
- grants select/insert/delete to `authenticated`;
- restricts every operation to `auth.uid() = user_id`;
- adds an ownership/timestamp index.

## 4. Configure local development

Use the values shown in `.env.example` as shell/build variables:

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
npm run build
```

The build generates `dist/config.js`. Never use a service-role key in browser configuration.

## 5. Configure Cloudflare Pages

Set the same two **public** build-time variables in the Cloudflare Pages project configuration. `scripts/build.mjs` writes them into `dist/config.js`.

## 6. Verify RLS

Use two separate browser profiles/incognito sessions. Each should create a different anonymous Supabase user and see only the entries created by that user.

## Public-launch hardening

Anonymous-account creation may be automated. Before broad public exposure, consider abuse controls/rate limits and CAPTCHA/Turnstile integration. If Supabase CAPTCHA is enabled, the application must pass a valid token into `signInAnonymously()`.
