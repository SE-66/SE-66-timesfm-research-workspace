# Open-Source Components and External Services

This repository follows an open-source-first workflow. Public source is not treated as permission to copy. External projects are integrated through supported package, container, API, or architectural boundaries unless their license and compatibility justify another approach.

# Current DevCloud deployment

## Gitea

- Project: `go-gitea/gitea`
- Version: 1.27.3
- License: MIT
- Purpose: self-hosted Git repositories, branches, pull requests, issues, packages, users, and Actions-compatible workflow surfaces.
- Integration method: pinned container image plus REST/CLI APIs.
- Modifications: none to upstream source.
- Source copied: none.
- Security boundary: public registration is disabled by the bootstrap configuration.

## Traefik

- Project: `traefik/traefik`
- Version: 3.7.13
- License: MIT
- Purpose: HTTP ingress/routing for DevCloud, Gitea, optional Supabase endpoints, and managed application containers.
- Integration method: pinned container image plus Docker labels.
- Modifications: none to upstream source.
- Source copied: none.

## Supabase self-hosted Docker distribution

- Project: `supabase/supabase`
- Pinned ref: `self-hosted/v0.8.2`
- Repository license: Apache-2.0; bundled services retain their own compatible licenses.
- Purpose: optional self-hosted PostgreSQL, Auth, PostgREST, Realtime, Storage, Edge Functions, and Studio data plane.
- Integration method: DevCloud executes Supabase's official self-host setup from the pinned upstream ref rather than vendoring the distribution.
- Local modification: DevCloud writes a Compose override that attaches the API gateway and Studio to the DevCloud ingress network.
- Source copied: none.
- Important boundary: self-hosted Supabase represents one Supabase project, so this milestone does not claim Supabase Cloud multi-project control-plane parity.

## Docker Engine API

- Project family: Docker Engine / `moby/moby`
- Purpose: first single-node runtime adapter.
- Integration method: a narrow internal Node service speaks the Docker Engine HTTP API over the Unix socket.
- Source copied: none.
- Security boundary: Docker-socket access is host-equivalent privilege. The runtime agent is internal-only.

## Cloudflare Workers / Wrangler

- Project: `cloudflare/workers-sdk`
- Wrangler command pinned for explicit deployment: 4.143.0
- License: MIT OR Apache-2.0 according to reviewed Wrangler package metadata.
- Purpose: Git-connected deployment of the DevCloud browser console through Workers Static Assets.
- Integration method: `wrangler.jsonc`, Cloudflare Workers Builds, and the deployment command.
- Source copied: none.
- Browser boundary: the build embeds only `DEV_CLOUD_API_URL`; administrator and infrastructure tokens are never build variables.

# Architectural/runtime references

## K3s

- Project: `k3s-io/k3s`
- License: Apache-2.0
- Purpose: planned multi-node workload isolation and scheduling adapter.
- Integration method: architectural/runtime reference in this milestone.
- Source copied: none.

## Cloudflare workerd

- Project: `cloudflare/workerd`
- License: Apache-2.0
- Purpose: reference for future Workers-compatible JavaScript/Wasm execution.
- Integration method: architectural reference only.
- Source copied: none.

# Legacy app-builder provenance

The following components were used by the previous Open Source App Builder product. Their source and migrations remain in repository history/source for provenance, but the current DevCloud root browser bundle does not load or invoke them.

## Supabase JavaScript client

- Project: `supabase/supabase-js`
- Former distribution: `@supabase/supabase-js@2.117.2` via jsDelivr
- License: MIT
- Former purpose: anonymous Auth, PostgREST operations, and Edge Function invocation.
- Current state: inactive in the DevCloud browser bundle.
- Modifications: none.

## JSZip

- Project: `Stuk/jszip`
- Former version: 3.10.1 via jsDelivr
- License choice: MIT (project is dual MIT/GPLv3)
- Former purpose: browser-side generated project ZIP creation.
- Reviewed upstream commit: `609d95f4098a11507160cd101e0b181cfad6a582` (2026-09-09).
- Current state: inactive in the DevCloud browser bundle.
- Modifications: none.

## Hugging Face Inference Providers

- Documentation: `https://huggingface.co/docs/inference-providers/`
- Former purpose: source-generation backend for the retired app-builder workflow.
- Former default model: `Qwen/Qwen3-Coder-480B-A35B-Instruct`.
- Current state: inactive in DevCloud.
- Model licenses remain model-specific; no model weights were bundled.

## GitHub REST repository search

- Former purpose: open-source repository discovery for the retired app-builder workflow.
- Current state: inactive in DevCloud.
- Source copied: none.

## stackblitz-labs/bolt.diy

- Repository: `https://github.com/stackblitz-labs/bolt.diy`
- License: MIT
- Reviewed commit: `2e254ac19a696394030601bc602f54945b12bfc4`
- Former purpose: architectural reference for browser app-builder UX and provider abstraction.
- Source copied: none.

## OpenHands/OpenHands

- Repository: `https://github.com/OpenHands/OpenHands`
- License: MIT
- Reviewed commit: `94e156a8c7b7a468d7c60bda3a38757bfbfd4a79`
- Former purpose: architectural reference for isolated coding-agent execution.
- Source copied: none.

## dyad-sh/dyad

- Repository: `https://github.com/dyad-sh/dyad`
- Root license: Apache-2.0 outside `src/pro`; `src/pro` uses a separate Functional Source License/fair-source boundary.
- Reviewed commit: `eb22a365ccedb84e006ccf60cc4a1ac7594e7f8d`
- Former purpose: architectural reference for local app-builder workflows and BYOK UX.
- Source copied: none.

# Repository source license

Original application/control-plane code in this repository is provided under the MIT License. External projects, services, and legacy references retain their own licenses and terms.
