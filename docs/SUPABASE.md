# Supabase Setup

## Project

Current project URL:

`https://vuwxwbdptspvbxptpmub.supabase.co`

Anonymous Sign-Ins must be enabled under Authentication settings.

## Schema

The app-builder control plane is defined by:

`supabase/migrations/20260929080000_create_open_source_app_builder_core.sql`

Tables:

- `builder_projects`
- `build_runs`
- `oss_candidates`
- `integration_decisions`
- `builder_artifacts`

Every table has RLS enabled and scopes rows to the current `auth.uid()`.

The legacy `research_entries` table from the discarded forecasting prototype is removed by `20260929083021_remove_legacy_timesfm_table.sql`. Historical migrations remain in the repository so the migration chain matches the live database.

## Edge Functions

### research-open-source

Source:

`supabase/functions/research-open-source/index.ts`

Deployment requirements:

- JWT verification enabled.
- No GitHub token is required for basic public search.
- Optional `GITHUB_TOKEN` can be added as a server-side Supabase secret later to increase GitHub API rate limits.

### generate-app

Source:

`supabase/functions/generate-app/index.ts`

Deployment requirements:

- JWT verification enabled.
- No persistent model API key is required.
- The user supplies a Hugging Face token for each generation request.
- The function accepts only the fixed Hugging Face Inference Providers endpoint.

## Browser build variables

Cloudflare needs only:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Do not use a secret/service-role key in browser configuration.

## Security verification

After schema changes:

1. confirm RLS is enabled on every exposed builder table;
2. confirm `anon` has no table privileges;
3. confirm `authenticated` has only the required CRUD privileges;
4. run Supabase Security Advisor;
5. review Performance Advisor findings before changing indexes.
