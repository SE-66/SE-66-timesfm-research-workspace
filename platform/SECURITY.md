# DevCloud Security

## Current trust model

This milestone is a **single-admin, single-node** deployment. It is not safe to expose as a multi-tenant public developer platform without the controls listed below.

## Control plane

- All API routes except `/api/health` require `CONTROL_PLANE_API_TOKEN`.
- The token is generated during bootstrap and is not committed.
- The dashboard stores it only in browser `sessionStorage`.
- Gitea's API token is available only to the control-plane container.
- Public Gitea registration is disabled by default.

The bootstrap bearer token is an administrative credential, not a user IAM system. Replace it with SSO/IAM before multi-user deployment.

## Runtime agent

The runtime agent mounts `/var/run/docker.sock`. Access to that socket is effectively host-administrator authority.

Controls in this milestone:

- the runtime agent is attached only to the internal Docker network;
- it has no Traefik/public route;
- every request requires a separate runtime-agent token;
- container image names, ports, subdomains, and environment-variable keys are validated;
- deletion is restricted to containers carrying `devcloud.managed=true`.

Do not expose the runtime-agent port publicly.

## User application containers

Application containers share one Docker network in this bootstrap milestone. That is insufficient isolation for untrusted multi-tenant workloads.

Before allowing arbitrary users to execute builds or containers, move workloads to the planned k3s adapter and add per-project namespaces, NetworkPolicies, resource quotas, restricted security settings, non-root builds, ephemeral build workers, image scanning, and egress policy.

## Secrets

The bootstrap `.env` is local server state and is gitignored.

Do not store production application secrets in the current deployment form. Environment values passed to Docker are visible to administrators with Docker inspection access. Add a Vault/KMS-backed secret adapter before advertising production secret management.

## Gitea Actions

Gitea Actions is enabled, but no runner is registered automatically. A runner executes repository-controlled code. Do not mount the host Docker socket into untrusted CI jobs. Prefer isolated/rootless Docker-in-Docker, microVMs, or the future k3s build-runner adapter.

## Supabase

The optional Supabase stack is bootstrapped from the official pinned upstream self-hosted release. Its generated secrets remain in `platform/.state/supabase/.env`.

The first milestone uses a shared Supabase installation. Do not imply project-level database isolation until the control plane provisions isolated data-plane tenants/instances.

## Network exposure

Development defaults use plain HTTP on `*.dev.localhost`. Production use requires real DNS, TLS/ACME, firewalling, private management ports, backups/restore tests, and central audit logs.

## Vulnerability response

External components are pinned. Review upstream security advisories and update deliberately; do not blindly float image tags merely to silence a scanner.
