# DevCloud Data Boundaries

## Cloudflare browser console

Cloudflare serves the static DevCloud console.

Public build output contains:

- HTML/CSS/JavaScript;
- `DEV_CLOUD_API_URL` when configured;
- the source repository URL;
- a CSP restricted to the configured API origin.

The browser-admin token is **not** a build variable. It is entered at runtime and stored only in `sessionStorage`.

## DevCloud control-plane database

The single-node control plane stores its own orchestration metadata in SQLite:

### Projects

- DevCloud project id;
- project slug and display name;
- description;
- Gitea repository URL;
- creation timestamp.

### Deployments

- DevCloud deployment id;
- owning project id;
- Docker container id;
- OCI image reference;
- generated host name and URL;
- deployment state;
- creation timestamp.

The control plane does not store the application source repository contents in SQLite.

## Gitea

Git repository data, branches, commits, issues, pull requests, packages, and Gitea account metadata belong to Gitea's own persistent storage.

The DevCloud control plane stores only the repository mapping/URL needed to connect a DevCloud project to Gitea.

## Runtime agent and Docker

The runtime agent receives a bounded deployment request from the control plane:

- project id/slug;
- public OCI image;
- internal container port;
- subdomain;
- validated environment variables when supplied.

The runtime agent translates that request into Docker Engine API operations.

Docker holds container configuration, image layers, runtime state, and logs. Current DevCloud SQLite records do not duplicate container logs.

## Optional self-hosted Supabase

The official self-hosted Supabase stack is a separate data plane under `platform/.state/supabase`.

Its PostgreSQL data, Auth users, Storage objects, Realtime state, function files, and generated secrets remain inside that self-hosted stack.

This milestone does not automatically create one Supabase installation per DevCloud project.

## Credentials

Credential placement is intentionally separated:

- `CONTROL_PLANE_API_TOKEN` — DevCloud server environment; typed into the console at runtime.
- `GITEA_TOKEN` — control-plane server environment only.
- `RUNTIME_AGENT_TOKEN` — control-plane/runtime internal environment only.
- Supabase generated secret keys — Supabase self-host state only.
- Docker socket — runtime-agent host mount only.

No privileged credential is intentionally emitted into the Cloudflare static bundle.

## Legacy source

Older app-builder Supabase migrations/functions remain as inactive repository source/provenance. They are not part of the active DevCloud browser data path.
