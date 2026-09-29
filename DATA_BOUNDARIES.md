# Data Boundaries

## Cloudflare-hosted outer application

The outer TimesFM Research Workspace:

- serves HTML/CSS/JavaScript assets;
- embeds the external Hugging Face Space;
- optionally communicates with Supabase for app-owned research metadata;
- does not expose a TimesFM inference endpoint;
- does not proxy or receive CSV uploads made inside the Space.

## Hugging Face Space

The iframe is a separate origin and execution environment. CSV uploads and forecast configuration performed **inside the Space** are handled by the Space/Hugging Face environment according to its current implementation and service policies.

This repository does not make retention or access-control claims for the third-party Space beyond what its provider documents.

## Supabase

When configured, Supabase stores only data explicitly entered in the outer research log:

- entry title;
- B0/C1–C5 scenario label;
- dataset label;
- notes;
- timestamps;
- anonymous Supabase user identifier used for RLS ownership.

The application intentionally does **not** upload the CSV file, iframe state, or TimesFM output automatically to Supabase.

### Authentication/session storage

The app uses Supabase Anonymous Sign-Ins. The Supabase JavaScript client persists the session in browser storage so the same browser can retrieve its rows later. If the user signs out, clears browser data, or changes devices, the anonymous account is not recoverable unless it was previously linked to a permanent identity.

### Authorization

The migration enables RLS. The `authenticated` Postgres role can access `research_entries`, but policies require `auth.uid() = user_id`. The unauthenticated `anon` role receives no table privileges.

## Configuration data

`SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are build-time inputs that are written into browser-visible `config.js`. They are not secrets and must be paired with correct RLS policies.

A Supabase service-role key is privileged and must never be placed in these build variables, GitHub source, or browser output.

## Future persistence rule

Any future storage of raw datasets, forecast arrays, files, or PII requires an explicit schema/security/retention review before implementation. Update this file and `SECURITY.md` before enabling such persistence.
