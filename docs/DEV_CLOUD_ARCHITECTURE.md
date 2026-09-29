# DevCloud architecture

## Product boundary

DevCloud aims to combine the developer workflows normally split between Git hosting, backend-as-a-service, and application deployment products in one control plane.

It does not copy proprietary implementations or branding.

## Source of truth

The control plane owns the mapping among:

- DevCloud project id;
- Gitea repository;
- backend/data-plane endpoints;
- deployments;
- domains;
- future CI/build records and secrets.

The bootstrap implementation uses Node 24's built-in SQLite API, keeping the control plane dependency-free. That is appropriate for a single-node bootstrap. An HA control plane should migrate the same records to PostgreSQL.

## Git plane

Gitea is integrated through its API and container distribution. It provides repositories, branches, pull requests, issues, packages, users, and Actions-compatible workflows.

## Data plane

The optional data plane uses Supabase's official self-hosted Docker distribution. It provides PostgreSQL, Auth, PostgREST, Realtime, Storage, Edge Functions and Studio.

Supabase's own self-hosting documentation says a self-hosted installation is one project. This milestone therefore exposes one shared Supabase installation. Per-project isolated Supabase provisioning is explicitly future work.

## Routing

Traefik consumes Docker labels and routes the dashboard, Gitea, control-plane API, deployed applications, and optional Supabase endpoints.

TLS is deliberately disabled in the development defaults. A real domain requires DNS plus an ACME resolver configuration.

## Runtime

The initial runtime agent has a narrowly defined Docker API surface:

- pull a public OCI image;
- validate project slug, subdomain, port and environment keys;
- create a container on the DevCloud network;
- apply DevCloud and Traefik labels;
- start it;
- stop/delete only containers marked `devcloud.managed=true`.

The agent is privileged because it mounts the Docker socket. It is reachable only on the internal network.

## Security progression

Before exposing DevCloud to multiple users:

1. replace the bootstrap bearer token with IAM/SSO;
2. move secrets to a vault/KMS;
3. add audit logging and quotas;
4. isolate builds from runtime workloads;
5. replace the Docker runtime with k3s namespaces/network policy;
6. use rootless or ephemeral CI runners;
7. add backups, restore tests and multi-node failover;
8. add per-project data-plane tenancy rather than a shared Supabase project.
