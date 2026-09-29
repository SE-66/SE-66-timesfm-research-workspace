# Cloudflare Workers Deployment

This repository is configured for the current **Cloudflare Workers Builds + Static Assets** Git workflow.

## Git build settings

Connect `SE-66/SE-66-timesfm-research-workspace` and use:

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: repository root / blank

The build writes the site to `dist/`. `wrangler.jsonc` then tells Workers Static Assets to deploy that directory:

```json
{
  "name": "timesfm-research-workspace",
  "compatibility_date": "2026-09-29",
  "assets": {
    "directory": "./dist"
  }
}
```

Do not use `wrangler pages deploy` for this Cloudflare Worker project.

## Supabase build variables

Add these as **build-time environment variables** for the production trigger (and preview trigger if you want Supabase enabled in previews):

- `SUPABASE_URL=https://vuwxwbdptspvbxptpmub.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`

The production build reports whether these were present:

- `Built static site to dist/ (Supabase enabled).` — both variables were provided.
- `Built static site to dist/ (Supabase disabled).` — one or both were absent.

Only use the Supabase publishable browser key. Never put a service-role or secret key in this frontend.

## Static response security

`public/_headers` is copied into `dist/`. Cloudflare Workers Static Assets parses the `_headers` file and applies its CSP and other response-security headers to static asset responses.

## Verification

Before deployment:

```bash
npm ci
npm run check
```

A successful Git deployment runs `npm run build` and then `npx wrangler deploy`, which uploads `./dist` through the Workers Static Assets configuration.
