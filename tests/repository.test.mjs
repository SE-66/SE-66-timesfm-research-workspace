import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../src/index.html', import.meta.url), 'utf8');
const js = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const build = await readFile(new URL('../scripts/build.mjs', import.meta.url), 'utf8');
const migration = await readFile(new URL('../supabase/migrations/202609290001_create_research_entries.sql', import.meta.url), 'utf8');
const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');

const scenarioIds = ['B0', 'C1', 'C2', 'C3', 'C4', 'C5'];

test('all research scenarios are documented', () => {
  for (const id of scenarioIds) assert.match(html, new RegExp(`>${id}<`));
});

test('TimesFM execution uses the external Hugging Face Space', () => {
  assert.match(html, /src="https:\/\/hari31416-ts-foundation-lab\.hf\.space"/);
  assert.match(html, /This page does not simulate TimesFM locally/);
});

test('official model and repository links are present', () => {
  assert.match(html, /https:\/\/github\.com\/google-research\/timesfm/);
  assert.match(html, /https:\/\/huggingface\.co\/google\/timesfm-3\.0-pytorch/);
});

test('Supabase client is version pinned and uses anonymous authentication', () => {
  assert.match(html, /@supabase\/supabase-js@2\.117\.2/);
  assert.match(js, /signInAnonymously/);
  assert.match(js, /__TIMESFM_RESEARCH_CONFIG__/);
});

test('build configuration is optional and rejects privileged browser credentials', () => {
  assert.match(build, /SUPABASE_URL/);
  assert.match(build, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(build, /service\[_-\]\?role/);
});

test('Supabase migration protects rows with RLS ownership', () => {
  assert.match(migration, /enable row level security/);
  assert.match(migration, /to authenticated/);
  assert.match(migration, /auth\.uid\(\)\) = user_id/);
  assert.doesNotMatch(migration, /grant .* to anon/i);
  assert.match(migration, /revoke all on table public\.research_entries from authenticated/);
});

test('Cloudflare response headers constrain scripts, iframe, and Supabase connections', () => {
  assert.match(headers, /script-src 'self' https:\/\/cdn\.jsdelivr\.net/);
  assert.match(headers, /frame-src https:\/\/hari31416-ts-foundation-lab\.hf\.space/);
  assert.match(headers, /connect-src 'self' https:\/\/\*\.supabase\.co/);
  assert.match(headers, /frame-ancestors 'none'/);
});
