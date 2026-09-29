# GitHub Repository Setup

Use a dedicated repository for this project, for example:

`SE-66/SE-66-timesfm-research-workspace`

Do not attach this codebase to the older `-timesfm-lab` repository.

## First push

After creating an empty GitHub repository:

```bash
git remote add origin https://github.com/SE-66/SE-66-timesfm-research-workspace.git
git branch -M main
git push -u origin main
```

If a remote already exists, inspect it before replacing it:

```bash
git remote -v
```

## Branch workflow

- `main` is the Cloudflare production branch.
- Use feature branches and pull requests for changes.
- `.github/workflows/ci.yml` runs repository verification, tests, and the production build.
- Connect the repository to Cloudflare Pages for branch/PR preview deployments.

## Secrets/configuration

Do not commit Supabase service-role keys or database passwords.

The two supported Cloudflare build variables are browser-visible public configuration:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

RLS is the security boundary for Supabase data access.
