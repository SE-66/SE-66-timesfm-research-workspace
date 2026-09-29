# Cloudflare Pages Deployment

## Recommended path: GitHub integration

1. Push this repository to a new GitHub repository.
2. In Cloudflare, open **Workers & Pages** and create a Pages application from an existing Git repository.
3. Select the GitHub repository.
4. Configure:
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: repository root
5. Set Node.js 22 for the build environment if Cloudflare does not already provide a compatible version.
6. If Supabase is enabled, add the build variables in both production and any preview environments that need persistence:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
7. Deploy.

Cloudflare Git integration will rebuild on pushes and can create preview deployments for branches/pull requests.

## Repository configuration

`wrangler.jsonc` contains:

- Pages project name: `timesfm-research-workspace`
- build output: `./dist`
- compatibility date.

`public/_headers` is copied into `dist/` by the repository build script and supplies production security headers for static Pages responses.

## Optional CLI deployment

After authenticating Wrangler:

```bash
npm run deploy:cloudflare
```

For a Git-integrated Pages project, prefer the Git deployment path as the normal source of truth. CLI deployment is primarily useful for explicit/manual workflows.

## Build verification

Before pushing:

```bash
npm ci
npm run check
```
