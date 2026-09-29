# DevCloud Architecture

## Product boundary

DevCloud is split into two deployment surfaces:

1. a dependency-light browser console hosted as Cloudflare Workers Static Assets;
2. a stateful self-hosted platform under `platform/`.

Cloudflare hosts the control UI. It does not host Gitea, Docker, PostgreSQL, Supabase, or the runtime agent.

The detailed platform design is in [docs/DEV_CLOUD_ARCHITECTURE.md](./docs/DEV_CLOUD_ARCHITECTURE.md).

## Browser console

The root build consists of:

- `src/index.html`;
- `src/styles.css`;
- `src/main.js`;
- generated `dist/config.js`;
- generated `dist/_headers`.

The only build-time service setting is `DEV_CLOUD_API_URL`.

The browser never receives the Gitea API token, runtime-agent token, Supabase secret key, Docker socket, or a preconfigured DevCloud admin token. The administrator enters `CONTROL_PLANE_API_TOKEN` interactively and the console stores it in `sessionStorage`.

## Control plane

The Node 24 control plane is the application-level source of truth for DevCloud projects and deployments.

Its current persistent records are:

- `projects` — DevCloud id, slug, name, description, and Gitea repository URL;
- `deployments` — project mapping, managed container id, image, host, URL, state, and creation time.

The bootstrap implementation uses Node's built-in SQLite interface with foreign keys, WAL mode, and a busy timeout. This is a single-node control-plane store, not the long-term HA database design.

## Git plane

Gitea provides the actual Git repository system.

Creating a DevCloud project calls Gitea's API to create a real private repository. DevCloud stores the returned repository URL rather than simulating repository state.

## Data plane

The optional backend/data layer follows Supabase's official self-hosted Docker distribution pinned to `self-hosted/v0.8.2`.

It provides PostgreSQL, Auth, PostgREST, Realtime, Storage, Edge Functions, and Studio.

Upstream self-hosted Supabase represents one Supabase project, so this milestone treats it as a shared data-plane service. DevCloud does not claim managed Supabase multi-project parity.

## Runtime plane

The first runtime adapter is an internal Docker Engine API service.

It can pull a public OCI image, validate the requested deployment, create a managed container, attach it to the DevCloud network, register Traefik labels, and stop/delete containers carrying the DevCloud management label.

Because the runtime agent mounts the Docker socket, it has host-equivalent authority and is never exposed through the public ingress.

The planned multi-tenant runtime adapter is k3s.

## Routing plane

Traefik watches Docker labels and routes:

- the self-hosted dashboard;
- Gitea;
- control-plane API requests;
- deployed application containers;
- optional Supabase endpoints.

The development configuration uses HTTP. Production requires real DNS and TLS/ACME configuration.

## Cloudflare-to-control-plane boundary

For the Cloudflare-hosted console:

- `DEV_CLOUD_API_URL` must be an HTTPS origin;
- the build emits that origin into the CSP `connect-src`;
- the control plane accepts cross-origin browser requests only from exact origins configured in `DASHBOARD_ORIGINS`.

This lets the console and stateful platform remain separately hosted without broad CORS or CSP wildcards.

## Current non-goals

The UI intentionally identifies, rather than fakes, unfinished capabilities:

- multi-user IAM/SSO;
- per-project Supabase instance orchestration;
- isolated Git-to-image build runners;
- private registry credential management;
- production secret vault/KMS;
- managed DNS/certificate lifecycle;
- central logs/traces;
- multi-node k3s scheduling;
- global edge/WAF/DDoS infrastructure.

## Legacy source

Earlier app-builder Supabase functions and migrations remain in repository history/source for migration provenance. They are not loaded by the current DevCloud root browser bundle.
