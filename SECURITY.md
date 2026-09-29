# Security

## Threat model

The application has two important external trust boundaries: the embedded Hugging Face Space and optional Supabase persistence. Cloudflare Workers Static Assets serves only the built static application.

## Hugging Face iframe

- The iframe executes third-party content from `hari31416-ts-foundation-lab.hf.space`.
- Same-origin policy prevents the outer page from directly inspecting iframe data/content.
- Cloudflare response CSP restricts `frame-src` to the approved Space origin.
- The iframe is not given a restrictive `sandbox` attribute because arbitrary restrictions can break the Gradio application; this is a compatibility/security tradeoff.
- `referrerpolicy="strict-origin-when-cross-origin"` limits cross-origin referrer detail.

## Supabase browser security

- Only the Supabase project URL and **publishable** key are browser configuration.
- No service-role key or database password may appear in public build variables.
- Anonymous Supabase users use the `authenticated` database role; RLS is mandatory.
- `research_entries` policies restrict rows to `auth.uid() = user_id`.
- Browser session persistence is expected and documented.
- The research log is limited to metadata/notes; do not enter secrets or sensitive raw datasets.

### Anonymous-auth abuse risk

Anonymous sign-ins can be automated. For a broadly public deployment, assess Supabase Auth rate limits and add an anti-abuse control such as CAPTCHA/Turnstile before allowing high-volume writes. If CAPTCHA is enabled in Supabase, the client must be updated to pass the CAPTCHA token to `signInAnonymously()`.

## Cloudflare headers

`public/_headers` is copied into the static asset directory `dist/`. Cloudflare Workers Static Assets parses this file and applies:

- Content Security Policy;
- `X-Frame-Options: DENY` for the outer app;
- `X-Content-Type-Options: nosniff`;
- strict referrer policy;
- restrictive Permissions Policy.

The CSP allows the pinned jsDelivr host for the Supabase browser SDK, Supabase HTTPS/WebSocket subdomains for client API traffic, and only the approved Hugging Face iframe origin.

## User uploads

This repository does not implement a CSV upload control. Uploads performed inside the iframe go to the external Space. Users should not provide sensitive/confidential data without reviewing that third-party service's handling, retention, and access controls.

## Dependency security

Significant dependencies are documented in `OPEN_SOURCE_COMPONENTS.md`. On updates:

1. use official packages/distributions;
2. review license and maintenance status;
3. keep `package-lock.json` committed;
4. run repository checks;
5. review unexpected transitive dependency changes;
6. prefer small, targeted version updates.

## Reporting

Report exploitable issues privately to the repository owner rather than publishing them in a public issue before remediation.
