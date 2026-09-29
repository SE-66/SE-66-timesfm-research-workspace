# Cloudflare Workers Deployment

This repository uses **Cloudflare Workers Builds + Static Assets** for the DevCloud browser console.

The stateful DevCloud services themselves do not run inside Cloudflare. Gitea, the control plane, the runtime agent, Traefik, and optional self-hosted Supabase run on the Linux DevCloud host under `platform/`.

## Git build settings

Repository:

`SE-66/SE-66-timesfm-research-workspace`

Use:

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: repository root / blank

`wrangler.jsonc` deploys `./dist` as Worker static assets.

## DevCloud API build variable

The console can deploy before the backend exists. In that state it renders the real DevCloud UI but marks backend actions unavailable.

Once the DevCloud server has a public HTTPS control-plane origin, add this **build variable**:

```text
DEV_CLOUD_API_URL=https://devcloud-api.example.com
```

Do not put `CONTROL_PLANE_API_TOKEN` in Cloudflare environment variables or browser source. The console asks the administrator for that token at runtime and keeps it in `sessionStorage` only.

A configured build prints:

`Built DevCloud console to dist/ (control-plane API configured).`

An unconfigured build prints:

`Built DevCloud console to dist/ (control-plane API not configured).`

## Server-side browser allowlist

When the Cloudflare console and control plane are on different origins, the server must explicitly allow the console origin.

Set `DASHBOARD_ORIGINS` in `platform/.env` to one or more comma-separated origins, for example:

```text
DASHBOARD_ORIGINS=https://console.example.com,https://preview.example.com
```

The control plane reflects CORS headers only for exact configured origins.

## CSP generation

`public/_headers` contains a build marker for the API origin.

During `npm run build`, the build script:

1. validates `DEV_CLOUD_API_URL`;
2. requires HTTPS except for localhost development;
3. inserts only that exact origin into `connect-src`;
4. writes the result to `dist/_headers`.

No Supabase browser key, Gitea API token, runtime-agent token, or control-plane admin token is embedded in the Cloudflare bundle.

## Public URL

Enable a `workers.dev` route or custom domain under the Worker's **Settings → Domains & Routes**.

For production, use a custom HTTPS domain for both the console and DevCloud API.

## Deployment verification

Cloudflare build logs should show:

1. `npm run build` succeeds;
2. the build reports whether the DevCloud API is configured;
3. `npx wrangler deploy` uploads `./dist` through `assets.directory`;
4. the deployed page title is **DevCloud Control Plane**, not **Open Source App Builder**.
