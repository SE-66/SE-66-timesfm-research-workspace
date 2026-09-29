import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = await readFile(resolve(root, 'src', 'index.html'), 'utf8');
const js = await readFile(resolve(root, 'src', 'main.js'), 'utf8');
const build = await readFile(resolve(root, 'scripts', 'build.mjs'), 'utf8');
const css = await readFile(resolve(root, 'src', 'styles.css'), 'utf8');
const headers = await readFile(resolve(root, 'public', '_headers'), 'utf8');
const migration = await readFile(resolve(root, 'supabase', 'migrations', '202609290001_create_research_entries.sql'), 'utf8');
const wrangler = await readFile(resolve(root, 'wrangler.jsonc'), 'utf8');

const requiredHtml = [
  'https://hari31416-ts-foundation-lab.hf.space',
  'https://huggingface.co/spaces/hari31416/ts-foundation-lab',
  'https://github.com/google-research/timesfm',
  'https://huggingface.co/google/timesfm-3.0-pytorch',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2',
  'timesfm-non-commercial-license-v1.0',
  'PhD Experiment Mode',
  'Research log',
  'B0', 'C1', 'C2', 'C3', 'C4', 'C5'
];

for (const token of requiredHtml) {
  if (!html.includes(token)) throw new Error(`Missing required HTML marker: ${token}`);
}

if (!html.includes('<iframe')) throw new Error('Missing live iframe.');
if (!js.includes('signInAnonymously')) throw new Error('Missing anonymous Supabase auth.');
if (!js.includes("from('research_entries')")) throw new Error('Missing Supabase research_entries integration.');
if (!build.includes('SUPABASE_URL') || !build.includes('SUPABASE_PUBLISHABLE_KEY')) throw new Error('Build must emit Supabase public configuration.');
if (!build.includes('service[_-]?role')) throw new Error('Build must reject service-role credentials.');
if (!migration.includes('enable row level security')) throw new Error('Supabase migration must enable RLS.');
if (!migration.includes('auth.uid()')) throw new Error('Supabase policies must scope rows to auth.uid().');
if (!headers.includes('Content-Security-Policy')) throw new Error('Missing Cloudflare security headers.');
if (!headers.includes('https://cdn.jsdelivr.net')) throw new Error('CSP must allow the pinned Supabase client CDN.');
if (!headers.includes('https://*.supabase.co')) throw new Error('CSP must allow configured Supabase HTTPS endpoints.');
if (!wrangler.includes('"assets"') || !wrangler.includes('"directory": "./dist"')) {
  throw new Error('Missing Cloudflare Workers static assets configuration.');
}
if (wrangler.includes('pages_build_output_dir')) {
  throw new Error('Pages-only configuration must not be mixed into Workers Builds.');
}
if (!css.includes('@media (max-width: 620px)')) throw new Error('Missing mobile breakpoint.');
if (/service[_-]?role/i.test(html + js)) throw new Error('Service-role credentials must not appear in browser source.');

console.log('Repository verification passed.');
