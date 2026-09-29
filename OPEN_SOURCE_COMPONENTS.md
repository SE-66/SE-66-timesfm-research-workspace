# Open-Source Components and External Services

This repository follows an open-source-first review process. External projects are used through supported distribution/service boundaries; TimesFM/Space source code is not copied into this application.

## google-research/timesfm

- Repository: https://github.com/google-research/timesfm
- License: Apache-2.0 for repository source code.
- Purpose: authoritative TimesFM implementation/documentation reference.
- Integration: reference/link only.
- Code copied: none.
- Modifications: none.

The official repository distinguishes its Apache-2.0 source code from the TimesFM 3.0 pretrained weights license.

## google/timesfm-3.0-pytorch

- Model card: https://huggingface.co/google/timesfm-3.0-pytorch
- License: `timesfm-non-commercial-license-v1.0` according to the official TimesFM repository release notice reviewed for this project.
- Purpose: authoritative TimesFM 3.0 pretrained model reference.
- Integration: weights are not bundled, downloaded, or loaded by this repository.
- Operational restriction: default TimesFM 3.0 pretrained weights are restricted to non-commercial, non-production use unless additional rights are granted.

## hari31416/ts-foundation-lab

- Space: https://huggingface.co/spaces/hari31416/ts-foundation-lab
- SDK: Gradio according to Hugging Face repository metadata reviewed during implementation.
- Purpose: external interactive forecasting workspace.
- Integration: cross-origin iframe plus direct fallback link.
- Source copied: none.
- Modifications: none.
- License note: public visibility is not treated as permission to reuse source. Any future code reuse requires its own license/dependency/security review.

## @supabase/supabase-js

- Project: https://github.com/supabase/supabase-js
- Browser distribution: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2`
- Version: 2.117.2 (pinned).
- License: MIT.
- Purpose: Supabase Anonymous Auth and Data API client.
- Integration: official browser/UMD distribution loaded from jsDelivr, a distribution method documented by Supabase.
- Modifications: none.
- Security boundary: only project URL/publishable key are exposed; privileged keys are prohibited in browser output.

## Cloudflare Pages / Wrangler

- Documentation: https://developers.cloudflare.com/pages/
- Wrangler project: https://github.com/cloudflare/workers-sdk
- Optional CLI version in repository command: 4.142.0.
- License: Wrangler npm metadata identifies `MIT OR Apache-2.0` at review time.
- Purpose: Git-integrated static hosting; Wrangler is optional for explicit CLI deployment.
- Integration: `wrangler.jsonc`, `public/_headers`, Cloudflare dashboard Git integration, and an optional pinned `npx` command.
- Code copied: none.

## Runtime/build dependencies

The local repository build scripts use Node.js standard-library modules only. The Supabase browser SDK is loaded at runtime from its pinned official CDN distribution. This keeps Cloudflare/GitHub builds free of npm application dependencies while retaining the maintained Supabase client instead of reimplementing Auth/Data APIs.

## Project source license

Original application code in this repository is provided under the MIT License. External model weights, third-party services, and linked repositories retain their own terms and are not relicensed by this repository.
