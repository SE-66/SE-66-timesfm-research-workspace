# Open-Source Source Review

Review date: 2026-09-29

The app-builder feature was researched before implementation. The reviewed projects were selected because they already solve adjacent AI coding/app-building problems and provide evidence for architecture rather than code to copy.

## bolt.diy

Repository: `stackblitz-labs/bolt.diy`

License file: MIT.

Relevant upstream characteristics reviewed:

- browser-based AI full-stack app development;
- multiple model-provider adapters;
- project ZIP export;
- Git/deployment integrations;
- Supabase integration;
- project snapshots/diffs.

Decision: **architectural reference only**. Its Remix/WebContainer/provider surface is much larger than required for this Cloudflare/Supabase builder. Forking it would introduce unnecessary dependencies and alter the existing architecture rather than integrate the smallest necessary portion.

Reviewed commit: `2e254ac19a696394030601bc602f54945b12bfc4`.

## OpenHands

Repository: `OpenHands/OpenHands`

License file: MIT.

Relevant upstream characteristics reviewed:

- coding-agent control center;
- separation between UI/control plane and agent backends;
- support for local, Docker, VM, remote, and cloud execution backends;
- bring-your-own-model design.

Decision: **architectural reference only** for the future sandbox/agent boundary. Current OpenHands Agent Canvas requires a significantly heavier backend/runtime than the desired Cloudflare static frontend + Supabase control plane.

Reviewed commit: `94e156a8c7b7a468d7c60bda3a38757bfbfd4a79`.

## Dyad

Repository: `dyad-sh/dyad`

License structure reviewed:

- code outside `src/pro`: Apache-2.0 according to the root license/README;
- `src/pro`: separate Functional Source License 1.1 / fair-source terms.

Relevant characteristics:

- local AI app builder;
- bring-your-own-key workflow;
- project/runtime tooling;
- active Cloudflare-related work.

Decision: **architectural reference only**. Electron/local runtime does not match Cloudflare deployment, and mixed licensing makes broad reuse inappropriate without a narrower source-level review.

Reviewed commit: `eb22a365ccedb84e006ccf60cc4a1ac7594e7f8d`.

## JSZip

Repository: `Stuk/jszip`

License: dual MIT/GPLv3; this project uses the MIT option.

Decision: **dependency** through pinned browser distribution for source ZIP export instead of implementing ZIP generation ourselves.

Reviewed commit: `609d95f4098a11507160cd101e0b181cfad6a582`.

## Resulting implementation decision

The current builder uses custom application-specific control-plane code because the reviewed full app builders are not drop-in compatible with the existing Cloudflare/Supabase architecture. It reuses maintained libraries/services at clean boundaries:

- Supabase client for Auth/Data/Function calls;
- JSZip for archive creation;
- GitHub API for repository discovery;
- Hugging Face Inference Providers for optional model execution;
- Cloudflare Workers Static Assets for hosting.

No source from bolt.diy, OpenHands, or Dyad was copied.
