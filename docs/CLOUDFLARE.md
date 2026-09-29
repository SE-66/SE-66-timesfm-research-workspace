# Cloudflare Workers Deployment

This repository uses **Cloudflare Workers Builds + Static Assets**, not legacy Pages configuration.

## Git build settings

Repository:

`SE-66/SE-66-timesfm-research-workspace`

Use:

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: repository root / blank

`wrangler.jsonc` deploys `./dist` as Worker static assets.

## Required build variables

Add both variables to the production build environment and to preview builds if previews should be functional:

```text
SUPABASE_URL=https://vuwxwbdptspvbxptpmub.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Use the Supabase **publishable** key. Never use a secret/service-role key.

A successful build prints:

`Built static site to dist/ (Supabase enabled).`

If it prints `Supabase disabled`, the builder UI can load but project/research/generation actions are intentionally disabled.

## Public URL

After deployment, enable a `workers.dev` route or custom domain under the Worker's **Settings → Domains & Routes**. The Worker currently has no public URL until a route is enabled.

## Headers

`public/_headers` is copied into `dist/_headers` and constrains:

- script origins;
- Supabase network connections;
- framing;
- browser capability permissions.

## Deployment verification

Cloudflare build logs should show both:

1. `npm run build` succeeds;
2. `npx wrangler deploy` uploads `./dist` using the `assets.directory` configuration.
