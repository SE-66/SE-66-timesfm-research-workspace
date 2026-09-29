# Open Source App Builder

Open Source App Builder is a browser-based application builder that follows one rule before substantial implementation: **research established open-source solutions first**.

The deployed builder lets a user:

1. describe an application and deployment constraints;
2. create a persistent project/run in Supabase;
3. search GitHub for established repositories through a Supabase Edge Function;
4. review maintenance and SPDX-license metadata;
5. explicitly record reuse/reference/reject/custom integration decisions;
6. generate a complete downloadable source bundle through Hugging Face Inference Providers using a user-supplied Hugging Face token;
7. store the generated bundle as an **unverified** artifact until its own install/test/build checks are executed elsewhere.

The application does not claim generated code has passed tests when no execution sandbox has run it.

## Architecture

- **Cloudflare Workers Static Assets** — hosts this builder UI from the GitHub repository.
- **Supabase Auth** — anonymous workspace identity; no email/password login UI.
- **Supabase Postgres + RLS** — stores projects, build runs, OSS candidates, integration decisions, and generated artifacts per anonymous user.
- **Supabase Edge Functions** — performs GitHub repository discovery and proxies generation requests.
- **GitHub REST search** — discovery source for open-source repository metadata.
- **Hugging Face Inference Providers** — optional source-generation backend using the user's own Hugging Face token and selected chat model.
- **JSZip** — creates a downloadable ZIP from the generated file bundle in the browser.

See [ARCHITECTURE.md](./ARCHITECTURE.md), [SECURITY.md](./SECURITY.md), and [DATA_BOUNDARIES.md](./DATA_BOUNDARIES.md).

## Open-source-first behavior

Research is not treated as permission to copy. GitHub search results are discovery evidence only. Before generated code is told to reuse a candidate, the workflow records a decision such as dependency, API, component, adapter, fork, architectural reference, or custom implementation.

Unknown, reciprocal, restrictive, and source-available licenses are not treated as permissive. Generated bundles are instructed to depend on or reference external projects instead of copying repository source, and every generated project must include `OPEN_SOURCE_COMPONENTS.md`.

Builder provenance and reviewed reference projects are in [OPEN_SOURCE_COMPONENTS.md](./OPEN_SOURCE_COMPONENTS.md) and [docs/SOURCE_REVIEW.md](./docs/SOURCE_REVIEW.md).

## Local development

Requires Node.js 20+.

```bash
npm ci
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
npm run dev
```

Run the repository checks:

```bash
npm run check
```

The production build is written to `dist/`.

## Supabase

The live project created for this builder is:

`https://vuwxwbdptspvbxptpmub.supabase.co`

Anonymous Sign-Ins must be enabled. The builder schema is defined in:

`supabase/migrations/20260929080000_create_open_source_app_builder_core.sql`

The Edge Functions are:

- `research-open-source`
- `generate-app`

See [docs/SUPABASE.md](./docs/SUPABASE.md).

## Hugging Face generation

The builder does not store a Hugging Face token. A user enters a token only when generating source. It is sent to the authenticated Supabase Edge Function and forwarded to Hugging Face Inference Providers for that request.

The default model field is:

`Qwen/Qwen3-Coder-480B-A35B-Instruct:fastest`

Users may enter another chat-completion model available through Hugging Face Inference Providers. Model licensing and provider charges remain the user's responsibility.

## Cloudflare Workers deployment

The repository is configured for the Cloudflare **Workers Builds + Static Assets** workflow.

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: repository root / blank
- Required build variables:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY`

`wrangler.jsonc` deploys `./dist` as static assets.

See [docs/CLOUDFLARE.md](./docs/CLOUDFLARE.md).

## Current verification boundary

This repository's own checks can be executed and verified. Generated application bundles cannot safely execute arbitrary package installs or shell commands inside the current Cloudflare/Supabase architecture. Therefore generated artifacts are stored as `unverified` and include the commands that must be run in a sandbox or CI system.

A future execution adapter should isolate untrusted generated code in a dedicated sandbox rather than running it inside the Supabase Edge Function or browser.
