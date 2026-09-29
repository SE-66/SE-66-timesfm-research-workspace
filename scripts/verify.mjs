import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = await readFile(resolve(root, 'src', 'index.html'), 'utf8');
const js = await readFile(resolve(root, 'src', 'main.js'), 'utf8');
const css = await readFile(resolve(root, 'src', 'styles.css'), 'utf8');
const build = await readFile(resolve(root, 'scripts', 'build.mjs'), 'utf8');
const headers = await readFile(resolve(root, 'public', '_headers'), 'utf8');
const wrangler = await readFile(resolve(root, 'wrangler.jsonc'), 'utf8');
const migration = await readFile(resolve(root, 'supabase', 'migrations', '20260929080000_create_open_source_app_builder_core.sql'), 'utf8');
const researchFn = await readFile(resolve(root, 'supabase', 'functions', 'research-open-source', 'index.ts'), 'utf8');
const generateFn = await readFile(resolve(root, 'supabase', 'functions', 'generate-app', 'index.ts'), 'utf8');

const requiredHtml = [
  'Open Source App Builder',
  'Inspect → Research → License → Integrate → Build → Verify',
  'Create project & research open source',
  'Generate source bundle',
  '@supabase/supabase-js@2.117.2',
  'jszip@3.10.1',
  'bolt.diy · MIT',
  'OpenHands · MIT',
  'Dyad · mixed Apache-2.0/FSL areas',
];
for (const token of requiredHtml) {
  if (!html.includes(token)) throw new Error(`Missing required HTML marker: ${token}`);
}

for (const stage of ['inspect','research','license','understand','integrate','build','test','verify']) {
  if (!html.includes(`data-stage="${stage}"`)) throw new Error(`Missing pipeline stage: ${stage}`);
}

if (!js.includes("from('builder_projects')")) throw new Error('Missing builder_projects persistence.');
if (!js.includes("from('oss_candidates')")) throw new Error('Missing OSS candidate persistence.');
if (!js.includes("from('integration_decisions')")) throw new Error('Missing integration decision persistence.');
if (!js.includes("from('builder_artifacts')")) throw new Error('Missing artifact persistence.');
if (!js.includes("functions.invoke('research-open-source'")) throw new Error('Missing OSS research function invocation.');
if (!js.includes("functions.invoke('generate-app'")) throw new Error('Missing generation function invocation.');
if (!js.includes('signInAnonymously')) throw new Error('Missing anonymous Supabase authentication.');
if (!js.includes('verification_state')) throw new Error('Generated artifacts must carry explicit verification state.');
if (!build.includes('__OPEN_SOURCE_APP_BUILDER_CONFIG__')) throw new Error('Build must emit app-builder config.');
if (!build.includes('SUPABASE_URL') || !build.includes('SUPABASE_PUBLISHABLE_KEY')) throw new Error('Build must emit Supabase public configuration.');
if (!build.includes('service[_-]?role')) throw new Error('Build must reject service-role credentials.');
if (!migration.includes('enable row level security')) throw new Error('Builder migration must enable RLS.');
if (!migration.includes('auth.uid()')) throw new Error('Builder RLS policies must scope rows to auth.uid().');
if (!researchFn.includes('api.github.com/search/repositories')) throw new Error('Research function must use GitHub repository search.');
if (!researchFn.includes('classifyLicense')) throw new Error('Research function must classify license metadata.');
if (!generateFn.includes('router.huggingface.co/v1/chat/completions')) throw new Error('Generate function must call Hugging Face Inference Providers.');
if (!generateFn.includes('verification_state: "unverified"')) throw new Error('Generate function must never claim unexecuted verification.');
if (!generateFn.includes('OPEN_SOURCE_COMPONENTS.md')) throw new Error('Generated bundles must require provenance documentation.');
if (!headers.includes('Content-Security-Policy')) throw new Error('Missing Cloudflare security headers.');
if (!headers.includes('https://cdn.jsdelivr.net')) throw new Error('CSP must allow pinned browser dependencies.');
if (!headers.includes('https://*.supabase.co')) throw new Error('CSP must allow Supabase API traffic.');
if (headers.includes('hari31416-ts-foundation-lab')) throw new Error('Old TimesFM iframe CSP must be removed.');
if (!wrangler.includes('"assets"') || !wrangler.includes('"directory": "./dist"')) throw new Error('Missing Workers static asset configuration.');
if (!css.includes('@media (max-width: 760px)')) throw new Error('Missing responsive breakpoint.');
if ((html + js + css).includes('TimesFM Research Workspace')) throw new Error('Old TimesFM product UI must not remain in the app source.');
if (/sb_secret_[A-Za-z0-9_-]+/.test(html + js)) throw new Error('Privileged Supabase secret keys must not appear in browser source.');

console.log('Repository verification passed.');
