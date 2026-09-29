# DevCloud Security

## Trust model

The current DevCloud milestone is a **single-admin, single-node** platform.

It is not a production multi-tenant execution service yet.

The more detailed host/runtime threat model is documented in [platform/SECURITY.md](./platform/SECURITY.md).

## Browser console

The Cloudflare-hosted console contains only public configuration:

- the configured DevCloud API origin;
- the source repository link;
- first-party HTML/CSS/JavaScript.

It does not embed:

- `CONTROL_PLANE_API_TOKEN`;
- Gitea API credentials;
- runtime-agent credentials;
- Docker credentials/socket;
- Supabase secret/service-role credentials.

The administrator enters `CONTROL_PLANE_API_TOKEN` manually. The console stores it in `sessionStorage`, so it is scoped to the current browser tab/session rather than persisted in local storage.

## Control-plane authentication

All control-plane routes except `GET /api/health` require the admin bearer token.

This token is a bootstrap administrator credential, not an IAM system. It must be replaced by real account/session authorization before multi-user use.

## Browser origin controls

The Cloudflare build validates `DEV_CLOUD_API_URL` and requires HTTPS except for localhost development.

The generated CSP permits network access only to:

- the page's own origin;
- the exact configured DevCloud API origin.

The control plane independently uses `DASHBOARD_ORIGINS` as an exact CORS allowlist. It does not use a credentialed wildcard origin.

## Gitea

Public registration is disabled in the bootstrap configuration.

The Gitea control token is available only inside the control-plane service and is never sent to the browser.

## Runtime agent

The runtime agent mounts `/var/run/docker.sock`. Docker-socket access is effectively host-administrator access.

Current controls include:

- internal Docker-network access only;
- a separate runtime-agent bearer token;
- no Traefik/public route;
- validation of image names, ports, subdomains, and environment-variable keys;
- deletion limited to containers carrying `devcloud.managed=true`.

Do not expose the runtime agent directly to the internet.

## Workload isolation

All managed application containers currently share the single-node Docker runtime/network.

Do not execute untrusted multi-tenant workloads in this configuration.

Before multi-user deployment, move workload execution to the planned k3s adapter with namespaces, NetworkPolicies, quotas, restricted security contexts, image policy/scanning, and isolated build workers.

## Secrets

The local `platform/.env` and generated Supabase state are gitignored.

The current platform does not advertise a production secret vault. Container environment values remain visible to administrators with Docker inspection access.

A KMS/Vault-backed secret adapter is required before production secret management is considered complete.

## CI runners

Gitea Actions is enabled, but no runner is registered automatically.

Repository-controlled CI is arbitrary code execution. Do not give untrusted CI jobs the host Docker socket. Use isolated/rootless runners, microVMs, or a k3s sandbox.

## Legacy builder source

Old Supabase app-builder functions/migrations remain in source history but are not loaded by the current DevCloud browser bundle. Their former browser dependencies and CSP origins have been removed from the active Cloudflare build.
