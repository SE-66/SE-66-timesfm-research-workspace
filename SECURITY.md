# Security

## Core trust model

The application has four important external boundaries:

- GitHub repository search;
- Supabase Auth/Postgres/Edge Functions;
- Hugging Face Inference Providers;
- Cloudflare Workers Static Assets.

Generated source is untrusted until separately reviewed and executed in an isolated verification environment.

## Authentication and RLS

The browser uses Supabase Anonymous Sign-Ins. These users receive the `authenticated` database role, so every builder table has RLS enabled and ownership policies based on `(select auth.uid()) = user_id`.

The unauthenticated `anon` role has no table privileges on builder tables.

## API keys

The browser receives only:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

These are public client configuration, not authorization boundaries.

Never expose a Supabase service-role/secret key in Cloudflare build variables or browser source.

## Hugging Face token handling

The Hugging Face token is BYOK and request-scoped:

- input type is `password`;
- the builder does not persist it in Supabase;
- the generation function does not log the request body;
- the function forwards it only to the fixed `router.huggingface.co` host;
- the browser clears the input after the generation attempt.

Use a limited-scope token with Inference Providers permission.

## SSRF and network boundaries

`generate-app` does not accept an arbitrary model API base URL. It always calls the fixed Hugging Face router host, avoiding a user-controlled server-side request target.

`research-open-source` always calls the fixed GitHub API host.

## Model output validation

The generation Edge Function validates:

- JSON shape;
- file count;
- relative file paths;
- parent-directory traversal;
- backslashes/absolute paths;
- per-file size;
- total artifact size;
- presence of `README.md` and `OPEN_SOURCE_COMPONENTS.md`.

This does not make generated code safe to execute. Package manifests and scripts remain untrusted.

## Generated-code execution

Do not execute generated project install/build/test scripts inside Supabase Edge Functions or the Cloudflare Worker. A future sandbox executor must implement resource limits, timeouts, network policy, secret isolation, and artifact/log capture.

## Anonymous-auth abuse

Public anonymous sign-ups can be automated. For a public launch, configure rate limits and an anti-abuse mechanism such as Cloudflare Turnstile/Supabase CAPTCHA. If CAPTCHA is enabled, the browser client must pass the CAPTCHA token to `signInAnonymously()`.

## Content Security Policy

The Cloudflare `_headers` file restricts:

- scripts to self + jsDelivr for pinned Supabase/JSZip browser distributions;
- network connections to self + Supabase project domains;
- framing by other origins;
- camera, microphone, geolocation, payment, and USB APIs.

## Dependency policy

Builder runtime dependencies are intentionally small. Significant dependencies/references are documented in `OPEN_SOURCE_COMPONENTS.md`. External code is not copied merely because it is public.
