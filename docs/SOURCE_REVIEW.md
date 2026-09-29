# Source Review

The project follows the supplied open-source source-priority policy: authoritative repositories/documentation and package registries are preferred; publicly visible code is not assumed reusable; license and compatibility boundaries are reviewed before integration.

## Google Research TimesFM

- Repository: https://github.com/google-research/timesfm
- Role: authoritative TimesFM source and release/license documentation.
- License: repository `LICENSE` is Apache-2.0.
- Current release note reviewed: TimesFM 3.0 is the latest version and its pretrained weights use the separate non-commercial license.
- Decision: reference only; no source code copied.

## TimesFM 3.0 Hugging Face model

- Model: https://huggingface.co/google/timesfm-3.0-pytorch
- Role: official model-card/reference endpoint.
- Decision: no weights bundled or downloaded.

## TS Foundation Lab Space

- Space: https://huggingface.co/spaces/hari31416/ts-foundation-lab
- Metadata reviewed: Hugging Face identifies it as a Gradio Space.
- Decision: embed as external service; do not copy Space source.

## Supabase JavaScript client

- Repository: https://github.com/supabase/supabase-js
- Package: `@supabase/supabase-js`
- License: MIT.
- Capability selected: Anonymous Auth plus PostgREST/Data API client.
- Decision: official package dependency rather than custom Auth/REST implementation.

## Supabase Anonymous Auth

Official documentation reviewed for `signInAnonymously()` and the distinction between anonymous users and the unauthenticated `anon` key/role. Anonymous users receive the authenticated database role, so project RLS policies must still enforce row ownership.

## Cloudflare Pages

Official Cloudflare Pages documentation reviewed for GitHub Git integration, `dist` build output, Wrangler Pages configuration, and `_headers` static response headers.

## Selection rationale

This architecture uses established supported boundaries instead of reimplementing authentication, database clients, model inference, or hosting behavior. Supabase's documented pinned browser distribution keeps the local build dependency-free while still using the maintained client. Custom code is limited to application-specific research-log UI/state, public configuration generation, and repository verification.
