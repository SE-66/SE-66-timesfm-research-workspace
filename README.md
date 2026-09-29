# TimesFM Research Workspace

A standalone research interface for zero-shot time-series forecasting with Google TimesFM 3. The application deliberately does **not** bundle TimesFM weights or pretend to run the model locally. Real model interaction happens inside the externally hosted TS Foundation Lab Hugging Face Space embedded in the page.

The repository is prepared for this deployment architecture:

- **GitHub** — source repository and pull-request workflow.
- **Cloudflare Workers Static Assets** — Git-connected static web deployment.
- **Supabase** — optional app-owned research-log metadata with anonymous authentication and Row Level Security (RLS).
- **Hugging Face Space** — external TimesFM execution and CSV upload boundary.

## Functional scope

- Responsive research-dashboard interface.
- Live embedded Hugging Face forecasting Space with a permanent direct fallback link.
- Four-step forecasting workflow guide.
- Explicit TimesFM source-code/model-weight license boundary.
- B0/C1–C5 research protocol labels.
- Optional Supabase research log for titles, scenario labels, dataset labels, and notes.
- No local TimesFM inference.
- No copying of CSV uploads from the embedded Space into Supabase.

## Local development

Requirements: Node.js 20+ (Node 22 is used in CI).

```bash
npm ci
npm run dev
```

Run the full repository checks:

```bash
npm run check
```

The production build is written to `dist/`.

## Supabase setup

The live Supabase project is `TimesFM Research Workspace`.

Project URL:

`https://vuwxwbdptspvbxptpmub.supabase.co`

Anonymous Sign-Ins are enabled, and the database migrations in `supabase/migrations/` document the live schema/RLS setup.

For Cloudflare or local builds, provide:

```bash
SUPABASE_URL=https://vuwxwbdptspvbxptpmub.supabase.co \
SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
npm run build
```

Only the publishable browser key belongs in generated client configuration. Never use a service-role key.

The RLS policies ensure each anonymous Supabase user can select, insert, and delete only their own research-log rows. Anonymous sessions are persisted by the Supabase client in browser storage; clearing browser data or changing devices loses access to that anonymous identity.

See [docs/SUPABASE.md](./docs/SUPABASE.md) and [DATA_BOUNDARIES.md](./DATA_BOUNDARIES.md).

## Cloudflare Workers deployment from GitHub

The repository contains `wrangler.jsonc`, `public/_headers`, and the production build script.

Use these Cloudflare Workers Build settings:

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: blank / repository root
- Production/preview build variables:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY`

`wrangler.jsonc` deploys `./dist` as Workers Static Assets.

See [docs/CLOUDFLARE.md](./docs/CLOUDFLARE.md).

## GitHub workflow

`.github/workflows/ci.yml` runs `npm ci` and `npm run check` on pull requests and pushes to `main`.

## External execution boundary

CSV files are uploaded **inside the embedded Hugging Face Space**. This application does not receive or persist those CSV files. The optional Supabase research log stores only user-entered metadata and notes from the outer application.

## License warning

The official `google-research/timesfm` source repository is Apache-2.0. TimesFM 3.0 pretrained weights are separately licensed under `timesfm-non-commercial-license-v1.0` and restricted to non-commercial, non-production use. Verify the latest terms in the official repository/model card before use.

Project-specific provenance is recorded in [OPEN_SOURCE_COMPONENTS.md](./OPEN_SOURCE_COMPONENTS.md).
