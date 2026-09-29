# Verification

## Builder repository

Run:

```bash
npm ci
npm run check
```

`npm run check` executes:

1. repository invariant checks;
2. Node tests;
3. production static build.

Also verify manually:

- responsive layout at desktop/tablet/mobile widths;
- anonymous Supabase session initializes;
- a project can be created;
- GitHub OSS research returns candidate cards;
- decisions persist;
- generation without a Hugging Face token fails clearly;
- generation with a valid Hugging Face token returns a bundle;
- token is cleared after the attempt;
- JSON/ZIP download works;
- recent projects persist after reload;
- generated artifact shows `Unverified`.

## Supabase

Verify:

- all builder tables have RLS enabled;
- ownership policies use `auth.uid()`;
- unauthenticated `anon` has no table privileges;
- Edge Functions require valid JWTs;
- Security Advisor has no unresolved high-impact findings.

## Cloudflare

Build with the live public Supabase values and confirm the build prints:

`Built static site to dist/ (Supabase enabled).`

Then verify the `workers.dev` or custom-domain route returns the builder UI with the CSP/security headers.

## Generated applications

The current control plane cannot execute arbitrary generated project commands. Every generated bundle is therefore `unverified`.

Before considering a generated application complete, run its generated verification commands in an isolated sandbox/CI environment and confirm at minimum:

- dependency installation;
- development startup where applicable;
- type checking/linting;
- tests;
- production build;
- main user flow;
- external API/database/auth operations;
- validation/error handling;
- deployment compatibility.
