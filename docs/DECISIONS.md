# Architecture Decisions

## ADR-001 — External Space is the TimesFM execution boundary

Status: accepted.

The existing Hugging Face Space already provides a TimesFM-capable workflow. Embedding it is smaller and more truthful than implementing a local imitation and avoids bundling restricted TimesFM 3.0 pretrained weights.

Consequences:

- model execution remains external;
- the app depends on third-party availability/iframe policy;
- a permanent direct fallback is required;
- CSV upload/data handling remains with the external environment.

## ADR-002 — No local baseline presented as TimesFM

Status: accepted.

This repository does not generate substitute TimesFM outputs. Future baselines must be labeled as distinct models/algorithms.

## ADR-003 — Keep the local build dependency-free

Status: accepted.

Supabase officially supports browser CDN distribution. The repository therefore keeps its Node build dependency-free and loads an exact pinned `@supabase/supabase-js` browser build from jsDelivr. This avoids reimplementing Auth/Data APIs while keeping Cloudflare/GitHub builds small. The CSP explicitly permits only the required CDN host.

## ADR-004 — Supabase Anonymous Auth instead of public anonymous table access

Status: accepted.

A no-login research experience still needs per-user row ownership. Supabase Anonymous Sign-Ins provide an authenticated `auth.uid()` without collecting email/password credentials. RLS scopes all research-log rows to that identity.

Tradeoff: the identity is tied to browser session storage and cannot be recovered after it is cleared unless later linked to a permanent identity.

## ADR-005 — Persist metadata, not CSV/model payloads

Status: accepted.

The research log stores only experiment metadata/notes. Raw CSV files and external Space outputs are not automatically copied into Supabase. This keeps the data boundary narrow and avoids silently duplicating potentially sensitive research datasets.

## ADR-006 — GitHub + Cloudflare Pages is the deployment pipeline

Status: accepted.

GitHub is the code/review source of truth. Cloudflare Pages Git integration runs the production build and deploys `dist/`, while GitHub Actions performs independent repository verification/tests/build checks.
