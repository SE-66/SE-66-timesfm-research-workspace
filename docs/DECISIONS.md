# Architecture Decisions

## ADR-001 — Keep the app builder as a control plane

**Decision:** The browser/Supabase application coordinates research, decisions, source generation, and artifact persistence. It does not execute arbitrary generated project commands.

**Reason:** Running untrusted package managers/build scripts requires stronger isolation than Supabase Edge Functions or a browser provide.

**Consequence:** Generated bundles are marked `unverified` until a dedicated sandbox/CI adapter is added.

## ADR-002 — Search open source before generation

**Decision:** A build run performs GitHub repository discovery before source generation and persists the results.

**Reason:** Open-source reuse should be evidence-based and auditable, not an invisible prompt instruction.

**Consequence:** Users can see repository/license/maintenance metadata and explicitly record how a candidate should be used.

## ADR-003 — Metadata does not equal permission

**Decision:** GitHub search metadata is never enough to authorize source reuse.

**Reason:** SPDX metadata can be absent, incomplete, mixed, or inconsistent with specific subdirectories/assets/dependencies.

**Consequence:** Unknown/reciprocal/restricted licenses are classified cautiously, and generated-code prompts prohibit silent source copying.

## ADR-004 — BYOK Hugging Face token

**Decision:** The first source-generation provider is Hugging Face Inference Providers with a user-supplied token sent per request.

**Reason:** This supports open-weight coding models without storing a shared model-provider secret in the builder database.

**Consequence:** The token is not persisted, and the Edge Function uses a fixed outbound provider host to reduce SSRF risk.

## ADR-005 — Reference full app builders instead of forking them

**Decision:** bolt.diy, OpenHands, and Dyad are architectural references only.

**Reason:** Their runtimes and dependency surfaces are substantially larger/different from this Cloudflare/Supabase architecture; Dyad also has a mixed license boundary.

**Consequence:** The current implementation remains small and application-specific while adopting the useful separation patterns observed in those projects.
