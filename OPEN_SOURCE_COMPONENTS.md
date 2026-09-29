# Open-Source Components and External Services

This repository follows an open-source-first workflow. Public source is not treated as permission to copy. Where external projects are reused, this application uses supported package/service boundaries or architectural reference rather than copying source files.

## Supabase JavaScript client

- Project: `supabase/supabase-js`
- Distribution used: `@supabase/supabase-js@2.117.2` via jsDelivr
- License: MIT
- Purpose: Anonymous Auth, PostgREST table operations, and Edge Function invocation.
- Integration method: browser dependency loaded from a pinned CDN URL.
- Modifications: none.

## JSZip

- Project: `Stuk/jszip`
- Version used: 3.10.1 via jsDelivr
- License choice: MIT (project is dual MIT/GPLv3)
- Purpose: create downloadable generated-project ZIP archives in the browser.
- Integration method: browser dependency loaded from a pinned CDN URL.
- Modifications: none.
- Reviewed upstream commit: `609d95f4098a11507160cd101e0b181cfad6a582` (2026-09-09).

## Cloudflare Workers / Wrangler

- Project: `cloudflare/workers-sdk`
- Wrangler command pinned for explicit deployment: 4.143.0
- License: MIT OR Apache-2.0 according to Wrangler package metadata reviewed during implementation.
- Purpose: Git-connected deployment of `dist/` through Workers Static Assets.
- Integration method: `wrangler.jsonc`, Cloudflare Workers Builds, and deployment command.
- Copied source: none.

## Hugging Face Inference Providers

- Documentation: `https://huggingface.co/docs/inference-providers/`
- Purpose: optional chat-completion backend used to generate source bundles.
- Default model: `Qwen/Qwen3-Coder-480B-A35B-Instruct` (Apache-2.0 model metadata reviewed on Hugging Face; model availability/provider routing can change).
- Integration method: authenticated HTTP request from the Supabase `generate-app` Edge Function to `https://router.huggingface.co/v1/chat/completions`.
- Credentials: user-supplied Hugging Face token; not persisted by the builder.
- Model license: varies by selected model. The builder does not bundle model weights and does not imply a model is open source merely because it is available through a provider.

## GitHub REST API

- Purpose: open-source repository discovery.
- Integration method: `research-open-source` Supabase Edge Function calls the GitHub repository search API.
- Copied source: none.
- Important boundary: repository search metadata is discovery evidence only; license files, dependency trees, source, compatibility, and security still require review.

# Architectural references reviewed, not embedded

## stackblitz-labs/bolt.diy

- Repository: `https://github.com/stackblitz-labs/bolt.diy`
- License: MIT
- Reviewed commit: `2e254ac19a696394030601bc602f54945b12bfc4`
- Purpose: reference for browser-oriented AI app-builder UX, provider abstraction, project export, and explicit deployment workflows.
- Integration method: architectural reference only.
- Copied source: none.
- Reason not adopted as a dependency/fork: substantially larger Remix/WebContainer-oriented application with a different runtime and deployment architecture than this Cloudflare/Supabase control plane.

## OpenHands/OpenHands

- Repository: `https://github.com/OpenHands/OpenHands`
- License: MIT
- Reviewed commit: `94e156a8c7b7a468d7c60bda3a38757bfbfd4a79`
- Purpose: reference for separating an agent-control UI from isolated coding-agent execution backends.
- Integration method: architectural reference only.
- Copied source: none.
- Reason not adopted: the current Agent Canvas/runtime expects a substantially heavier agent backend and Node 24+ environment; it is not compatible with a small Cloudflare static control plane without an additional sandbox service.

## dyad-sh/dyad

- Repository: `https://github.com/dyad-sh/dyad`
- Root license: Apache-2.0 for code outside `src/pro`; `src/pro` is under a separate Functional Source License 1.1 / fair-source license according to the repository README/LICENSE structure reviewed.
- Reviewed commit: `eb22a365ccedb84e006ccf60cc4a1ac7594e7f8d`
- Purpose: reference for local app-builder workflow and bring-your-own-model-key UX.
- Integration method: architectural reference only.
- Copied source: none.
- Reason not adopted: Electron/local-runtime architecture is incompatible with the desired Cloudflare deployment, and the mixed licensing boundary makes selective source reuse require more care than needed for this implementation.


# DevCloud platform components

## Gitea

- Project: `go-gitea/gitea`
- Version: 1.27.3
- License: MIT.
- Purpose: self-hosted Git repositories, branches, pull requests, issues, packages and Actions-compatible workflow surfaces.
- Integration method: pinned container image plus REST/CLI APIs.
- Source copied: none.
- Security note: public registration is disabled in the bootstrap configuration.

## Traefik

- Project: `traefik/traefik`
- Version: 3.7.13
- License: MIT.
- Purpose: HTTP routing for the DevCloud dashboard, Git service, API, Supabase endpoints and managed application containers.
- Integration method: pinned container image and Docker labels.
- Source copied: none.

## Supabase self-hosted Docker distribution

- Project: `supabase/supabase`
- Pinned ref: `self-hosted/v0.8.2`
- License: Apache-2.0 at repository level; individual bundled services retain their own compatible licenses.
- Purpose: optional self-hosted PostgreSQL, Auth, PostgREST, Realtime, Storage, Edge Functions and Studio data plane.
- Integration method: the DevCloud bootstrap executes Supabase's official self-host setup from the pinned upstream ref; the Supabase source/configuration is not vendored into this repository.
- Modifications: a local Compose override adds DevCloud's external network and Traefik routing.
- Important boundary: upstream documents self-hosted Supabase as one project, so this milestone does not claim multi-project Supabase control-plane parity.

## Docker Engine API

- Project: `moby/moby` / Docker Engine API.
- Purpose: first single-node runtime adapter.
- Integration method: a narrow internal runtime agent speaks the Engine HTTP API over the Unix socket.
- Source copied: none.
- Security note: Docker-socket access is host-equivalent privilege; the runtime agent is internal-only and intended to be replaced by the k3s adapter for multi-tenant deployments.

# DevCloud architectural references

## K3s

- Project: `k3s-io/k3s`
- License: Apache-2.0.
- Purpose: planned multi-node runtime/orchestration adapter.
- Integration method: architectural/runtime reference only in this milestone.
- Source copied: none.

## Cloudflare workerd

- Project: `cloudflare/workerd`
- License: Apache-2.0.
- Purpose: planned Workers-compatible JavaScript/Wasm runtime adapter.
- Integration method: architectural reference only in this milestone.
- Source copied: none.

# Builder source license

Original application code in this repository is provided under the MIT License. External services, models, generated project dependencies, and architectural references retain their own terms.
