# Architecture

## Product goal

Create applications by combining three distinct activities instead of collapsing them into one model prompt:

1. **research** reusable open-source projects;
2. **record** a licensing/compatibility integration decision;
3. **generate** the application-specific source bundle from the resulting evidence.

The architecture deliberately keeps arbitrary generated-code execution outside the current control plane.

## Browser application

The browser application is a dependency-light static UI built from:

- `src/index.html`
- `src/styles.css`
- `src/main.js`

It manages the workflow, renders research results, records decisions, requests source generation, and downloads the resulting source ZIP.

The browser does not contain privileged credentials.

## Supabase control plane

### Authentication

The builder creates or resumes a Supabase anonymous user. Anonymous users use the `authenticated` Postgres role, so RLS is mandatory.

### Data model

- `builder_projects` — application brief and project status.
- `build_runs` — immutable-ish run identity plus current pipeline stage/status.
- `oss_candidates` — GitHub repository discovery metadata.
- `integration_decisions` — user decision about reuse/reference/reject/custom implementation.
- `builder_artifacts` — generated source bundles and future build/verification artifacts.

All tables carry `user_id` and enforce ownership with RLS.

### Edge Functions

#### `research-open-source`

- requires a valid Supabase JWT;
- sends a bounded query to GitHub repository search;
- uses a fixed GitHub API host;
- classifies SPDX metadata into permissive/reciprocal/restricted/unknown/review categories;
- derives a basic maintenance state from archive/push metadata;
- returns discovery evidence and an explicit review caveat;
- can optionally use a server-side `GITHUB_TOKEN`, but does not require one.

It does not claim a repository is safe or compatible merely because search metadata looks favorable.

#### `generate-app`

- requires a valid Supabase JWT;
- accepts the project brief, selected OSS evidence, explicit integration decisions, a user-supplied Hugging Face token, and model id;
- sends the generation request only to `https://router.huggingface.co/v1/chat/completions`;
- instructs the model not to copy external repository source;
- requires `README.md` and `OPEN_SOURCE_COMPONENTS.md` in every generated bundle;
- validates generated paths/file count/size before returning the artifact;
- always returns `verification_state: "unverified"`.

The Hugging Face token is request-scoped and is not inserted into Supabase.

## Cloudflare

GitHub is the source repository. Cloudflare Workers Builds runs `npm run build` and `npx wrangler deploy`. `wrangler.jsonc` deploys the `dist/` directory through Workers Static Assets.

`public/_headers` becomes `dist/_headers` and constrains scripts/connections to the required browser dependencies and Supabase endpoints.

## Generated-code execution boundary

The control plane does **not** execute generated project shell commands. Arbitrary package installation/build execution requires a dedicated sandbox with resource limits, network policy, secret isolation, timeout enforcement, artifact capture, and log redaction.

Reviewed reference architectures include bolt.diy, OpenHands, and Dyad. Their runtime models are materially heavier than this Cloudflare/Supabase control plane, so they are architectural references rather than embedded dependencies.

## Future adapters

Potential future boundaries:

- isolated sandbox executor;
- GitHub repository/export adapter;
- pull-request writer;
- Cloudflare/Vercel/Netlify deployment adapters;
- dependency vulnerability/license scanner;
- model-provider adapters beyond Hugging Face.

Each should be added behind a narrow interface without replacing Supabase as the control-plane source of truth.
