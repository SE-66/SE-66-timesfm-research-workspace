# DevCloud

DevCloud is an open-source-first developer control plane that combines Git hosting, backend services, application deployments, and routing behind one project model.

The deployed root application is a **Cloudflare-hosted control console**. The actual stateful services run on the self-hosted DevCloud server under `platform/`.

## Current functional milestone

The current implementation provides:

- private Git repositories through **Gitea 1.27.3**;
- a persistent Node 24 control plane backed by SQLite for project/deployment mappings;
- an internal Docker runtime agent that deploys public OCI images;
- automatic HTTP routing through **Traefik 3.7.13**;
- an optional official self-hosted **Supabase** data plane pinned to `self-hosted/v0.8.2`;
- a Cloudflare static console that creates projects, opens Git repositories, deploys images, lists deployments, and stops managed deployments through the real control-plane API.

It does **not** present unfinished features as complete. Multi-user IAM, isolated CI runners, a secret vault, managed domains/TLS workflows, central logs, and the k3s multi-node runtime are explicit future adapters.

## Repository layout

- `src/` — Cloudflare-hosted DevCloud console.
- `platform/` — self-hosted control plane, Gitea, Traefik, runtime agent, bootstrap scripts, and optional Supabase integration.
- `docs/DEV_CLOUD_ARCHITECTURE.md` — platform architecture and trust boundaries.
- `OPEN_SOURCE_COMPONENTS.md` — external projects, versions, licenses, and integration methods.

## Run the Cloudflare console locally

Requires Node.js 20+.

Without a backend:

```bash
npm ci
npm run dev
```

The UI renders but clearly reports that the control plane is not configured.

With a live DevCloud API:

```bash
DEV_CLOUD_API_URL=https://devcloud-api.example.com npm run dev
```

The API URL is public browser configuration. The administrative `CONTROL_PLANE_API_TOKEN` is entered interactively and stored only in browser `sessionStorage`.

Run all root checks:

```bash
npm run check
```

## Run the self-hosted platform

Requirements: Linux, Docker Engine + Compose plugin, Git, and OpenSSL.

```bash
cd platform
sh scripts/bootstrap.sh
```

Then optionally add the official self-hosted Supabase stack:

```bash
sh scripts/bootstrap-supabase.sh
```

See [platform/README.md](./platform/README.md) and [platform/SECURITY.md](./platform/SECURITY.md).

## Cloudflare deployment

The repository remains configured for Cloudflare Workers Builds + Static Assets:

- production branch: `main`;
- build command: `npm run build`;
- deploy command: `npx wrangler deploy`;
- root directory: repository root;
- static output: `dist/`.

Once the DevCloud server is online, set the Cloudflare **build variable**:

```
DEV_CLOUD_API_URL=https://<public-control-plane-origin>
```

The production build validates that the API uses HTTPS and generates a CSP that permits network requests only to the configured control-plane origin.

The server must also list the Cloudflare console origin in `DASHBOARD_ORIGINS` so browser CORS requests are accepted.

See [docs/CLOUDFLARE.md](./docs/CLOUDFLARE.md).

## Security boundary

The first runtime agent mounts the Docker socket and therefore has host-equivalent authority. It is intentionally internal-only. This milestone is suitable as a single-admin bootstrap, not as an internet-facing multi-tenant execution environment.

Before multi-user use, the roadmap requires IAM/SSO, a secret vault/KMS, isolated build workers, quotas, audit logs, backups, and a k3s-based workload isolation layer.

## Open-source provenance

DevCloud integrates upstream projects through supported containers and APIs rather than copying their source. Important components and reviewed licenses are recorded in [OPEN_SOURCE_COMPONENTS.md](./OPEN_SOURCE_COMPONENTS.md).
