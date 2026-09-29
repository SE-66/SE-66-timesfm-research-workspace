# Verification

## Automated checks

From repository root:

```bash
npm ci
npm run check
```

This runs:

1. repository/source invariant verification;
2. Node tests;
3. dependency-free production build to `dist/`, including generated browser configuration.

## Core manual checks (Supabase disabled)

1. Load the built site.
2. Confirm the four workflow steps are readable.
3. Confirm the embedded Space loads when browser/network policy permits.
4. Confirm the direct Hugging Face fallback opens in a new tab.
5. Confirm official TimesFM repository/model-card links work.
6. Confirm the research log displays `Supabase not configured` and remains disabled without environment variables.
7. Confirm B0/C1–C5 protocol cards remain visible and do not run forecasts.

## Supabase functional checks

After configuring a project, applying the migration, and enabling Anonymous Sign-Ins:

1. Load the application and confirm status changes to `Supabase connected`.
2. Save a research entry.
3. Refresh and confirm the entry persists.
4. Delete the entry and confirm it disappears.
5. Open a second browser profile/incognito session and confirm it cannot see the first profile's entries.
6. Confirm no raw CSV is uploaded by the outer application.

## Cloudflare checks

1. Connect the GitHub repository to Cloudflare Pages.
2. Build with `npm run build` and output directory `dist`.
3. Confirm `_headers` is active on the deployed response.
4. Confirm branch/PR preview deployments build successfully.
5. Confirm Supabase environment variables are set only where persistence is intended.

## Responsive checks

Check approximately 1440 px, 1024 px, 768 px, 390 px, and 320 px widths. The iframe, research-log form/list, navigation, and scenario cards must remain usable without horizontal clipping.
