# DevCloud — self-hosted developer cloud

This directory contains the first deployable control plane for a unified Git + backend + deployment environment.

The implementation composes established open-source systems instead of rebuilding Git hosting, backend services, routing, and container execution from scratch.

## What works in this milestone

- one dashboard and one project model;
- real private Git repositories created through Gitea;
- Gitea branches, pull requests, issues, package registry and Actions UI;
- real deployment of a public OCI image through the runtime agent;
- automatic per-deployment HTTP routing through Traefik;
- persistent project/deployment mappings in the local control-plane database;
- optional official self-hosted Supabase stack for Postgres, Auth, REST, Realtime, Storage, Functions and Studio;
- service health reporting;
- admin bearer-token protection on control-plane APIs.

## Explicit boundary

This is a **single-node, single-admin MVP**. It does not claim global infrastructure parity with GitHub, Supabase Cloud or Cloudflare.

Not complete yet:

- multi-tenant IAM/SSO;
- automatic per-project Supabase instance provisioning;
- Git-to-image build pipelines and private registry credentials;
- global edge/Anycast, WAF or DDoS infrastructure;
- multi-node k3s scheduling;
- production KMS/secret vault;
- isolated untrusted CI/build sandboxes.

Those are separate adapter milestones and are not represented as working buttons.

## Start the core

Requirements: Linux, Docker Engine + Compose plugin, Git, OpenSSL.

```bash
cd platform
sh scripts/bootstrap.sh
```

The script generates local secrets, starts Traefik/Gitea/runtime/dashboard, creates a Gitea admin, generates the API token used by the control plane, and then starts the control plane.

Default development hostnames use `dev.localhost`. Depending on the resolver, add `dev.localhost`, `git.dev.localhost`, and application subdomains to `/etc/hosts`.

## Add self-hosted Supabase

```bash
sh scripts/bootstrap-supabase.sh
```

The script uses Supabase's official Docker self-hosting setup pinned to `self-hosted/v0.8.2`. It does not copy Supabase source into this repository.

The resulting stack is kept under `platform/.state/supabase`, connected to the private DevCloud Docker network, and routed through Traefik.

Supabase documents that self-hosting represents one Supabase project. This MVP therefore exposes a shared data plane rather than pretending it already implements Supabase Cloud's multi-project control plane.

## Create a project

Open the dashboard, enter the generated `CONTROL_PLANE_API_TOKEN`, then create a project. DevCloud creates a real private Gitea repository and stores the mapping.

## Deploy an image

A project can deploy a public OCI image plus its internal port. The runtime agent pulls the image with Docker, creates a managed container on the `devcloud` network, and registers a Traefik host rule.

The runtime agent has Docker-socket authority. It is intentionally internal-only and must never be exposed directly to the internet.

## CI

Gitea Actions is enabled, but no runner is auto-registered. A runner executes repository-controlled code; its registration is an explicit security decision. Prefer rootless Docker-in-Docker or a later k3s sandbox rather than the host Docker socket.

## Next runtime

The next production-oriented adapter is k3s. K3s provides a Kubernetes API and containerd scheduling with a small operational footprint. The Docker runtime agent exists to make the first single-node platform genuinely runnable, not to serve as the final multi-tenant isolation model.
