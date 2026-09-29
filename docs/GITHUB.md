# GitHub Repository Setup

This project uses the dedicated repository:

`SE-66/SE-66-timesfm-research-workspace`

Do not attach this codebase to the older `-timesfm-lab` repository.

## Branch workflow

- `main` is the Cloudflare production branch.
- Use feature branches and pull requests for changes.
- `.github/workflows/ci.yml` runs repository verification, tests, and the production build.
- Cloudflare Workers Builds is connected to this repository and deploys the `main` branch.

## Cloudflare build settings

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: repository root / blank
- Production branch: `main`

## Secrets/configuration

Do not commit Supabase service-role keys or database passwords.

The supported Cloudflare **build-time** variables are browser-visible public configuration:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

RLS is the security boundary for Supabase data access.
