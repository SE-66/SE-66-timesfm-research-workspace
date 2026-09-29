# Cloudflare Pages Deployment

## Recommended path: GitHub integration

1. Push this repository to GitHub.
2. In Cloudflare, open **Workers & Pages** and create a **Pages** application from the Git repository.
3. Select `SE-66/SE-66-timesfm-research-workspace`.
4. Configure:
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: repository root / blank
   - **Deploy command: leave blank** for Git-integrated Pages
5. Set Node.js 22 if you want the build runtime pinned to the same version used in CI.
6. Add these build variables for Production and Preview:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
7. Save and redeploy.

Cloudflare Pages Git integration uploads the configured build output after a successful build. Do **not** set `npx wrangler deploy` as the deploy command: that is the Workers deploy path and will fail against this Pages configuration.

If you intentionally switch to a manual/Direct Upload workflow instead of Git integration, the Pages-specific command is:

```bash
npx wrangler pages deploy dist
```

Do not combine manual Wrangler deployment with the normal Git-integrated deployment path unless you intentionally disable automatic Git deployments.

## Supabase build configuration

The production build reports whether Supabase was enabled:

- `Built static site to dist/ (Supabase enabled).` means both public build variables were present.
- `Built static site to dist/ (Supabase disabled).` means one or both Cloudflare build variables were not provided.

The required values are browser-visible public configuration. Never use a Supabase service-role or secret key in this frontend.

## Repository configuration

`wrangler.jsonc` records the Pages project name, `./dist` output directory, and compatibility date.

`public/_headers` is copied into `dist/` and applies the production security headers for the static Pages site.

## Verification

Before pushing:

```bash
npm ci
npm run check
```
