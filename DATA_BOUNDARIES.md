# Data Boundaries

## Builder metadata stored in Supabase

The builder stores app-owned workflow data:

- project name and brief;
- stack/deployment preferences;
- build-run status/stage;
- GitHub repository discovery metadata;
- license/maintenance classifications derived from search metadata;
- explicit integration decisions and rationale;
- generated source-bundle JSON;
- artifact verification state.

RLS scopes these rows to the current anonymous Supabase user.

## GitHub research

The `research-open-source` Edge Function sends only the derived repository search query to GitHub's public repository search API. It does not send the full Supabase user record or Hugging Face token.

Returned GitHub metadata is discovery evidence, not a legal/security guarantee.

## Hugging Face generation

When the user clicks **Generate source bundle**, the browser sends the following to the authenticated `generate-app` Edge Function:

- project brief and preferences;
- selected OSS candidate metadata;
- recorded integration decisions;
- selected Hugging Face model id;
- the user-entered Hugging Face token.

The Edge Function forwards the token to Hugging Face Inference Providers for that generation request. The token is not written into application tables by the builder code.

Users should use a limited-scope Hugging Face token with only the permissions needed for Inference Providers.

## Generated source artifacts

The generated bundle is stored as JSON in `builder_artifacts` and may contain application source code, configuration templates, README documentation, and dependency manifests.

Generated code must not contain real secrets. Provider/model output is treated as untrusted until reviewed.

## Browser downloads

JSZip creates the ZIP entirely in the browser from the stored/generated file list. The ZIP is not uploaded to another service by this application.

## Legacy table

The legacy `research_entries` TimesFM prototype table has been removed from the live database. Its historical migration remains in source history, followed by a cleanup migration so fresh migration replays converge on the current app-builder schema.
