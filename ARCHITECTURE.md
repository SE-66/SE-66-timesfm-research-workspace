# Architecture

## Goals

1. Present a reliable research interface for the existing TimesFM-capable Hugging Face Space.
2. Keep model execution and CSV handling outside the application boundary.
3. Use GitHub as the source-of-truth repository and Cloudflare Pages for deployment.
4. Add narrowly scoped Supabase persistence for research metadata without exposing privileged credentials.
5. Preserve a clean future adapter boundary for an authorized inference API.

## Runtime components

### Static application

- `src/index.html` contains semantic page structure and the external iframe.
- `src/styles.css` contains responsive presentation.
- `src/main.js` contains the optional Supabase research-log client.
- `scripts/build.mjs` copies validated source into `dist/` and generates `config.js` from public build variables for Cloudflare Pages.

### External TimesFM workspace

Iframe:

`https://hari31416-ts-foundation-lab.hf.space`

Direct fallback:

`https://huggingface.co/spaces/hari31416/ts-foundation-lab`

This origin is a separate trust, data, and model-execution boundary.

### Supabase research log

The browser uses the pinned official `@supabase/supabase-js` UMD build distributed through jsDelivr with a project URL and publishable key. When configured, it creates or resumes an anonymous Supabase Auth session and reads/writes `public.research_entries`.

Stored fields are intentionally limited to:

- title;
- B0/C1–C5 scenario label;
- non-sensitive dataset label;
- researcher notes;
- timestamps and ownership identifier managed by Supabase/Postgres.

RLS enforces `auth.uid() = user_id` for select/insert/delete. The browser never receives a service-role key.

### GitHub

GitHub is the source repository, code-review surface, and CI trigger. `.github/workflows/ci.yml` verifies source invariants, tests, and production build output.

### Cloudflare Pages

Cloudflare Pages builds from GitHub with `npm run build` and serves `dist/`. `public/_headers` is copied into the build output and applies security headers to static responses. `wrangler.jsonc` records the Pages output directory for local/CLI compatibility.

## Data flow

### Forecast workflow

1. Browser loads the outer application from Cloudflare Pages.
2. Browser independently loads the Hugging Face Space iframe.
3. Researcher uploads CSV data inside the iframe.
4. Forecast inputs/outputs are handled by the Space/Hugging Face environment.
5. The outer application does not receive an application-level copy of the CSV.

### Research-log workflow

1. The build writes the Supabase project URL and publishable key into generated public `config.js`, then the browser reads that configuration.
2. Supabase Auth creates or resumes an anonymous session.
3. The researcher explicitly enters metadata/notes into the outer research-log form.
4. Supabase Data API writes those fields into `research_entries`.
5. RLS constrains reads/deletes/inserts to the current `auth.uid()`.

## Trust boundaries

- **Cloudflare Pages:** serves this repository's built static assets.
- **Browser:** holds the Supabase anonymous session and renders both application and cross-origin iframe.
- **Supabase:** stores only app-owned research metadata when enabled.
- **Hugging Face Space:** handles CSV upload and model execution.
- **Google/Hugging Face model repositories:** authoritative documentation/license references, not copied runtime code.

## Future inference adapter

If an authorized TimesFM API becomes available, add a dedicated server-side adapter rather than placing credentials in browser code. The adapter should validate input sizes and schemas, define retention rules, use an explicit model/version identifier, and preserve the visible license/execution disclosure. Do not silently replace the external execution path with a mock or local baseline.
