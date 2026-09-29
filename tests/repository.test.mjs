import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../src/index.html', import.meta.url), 'utf8');
const js = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const build = await readFile(new URL('../scripts/build.mjs', import.meta.url), 'utf8');
const migration = await readFile(new URL('../supabase/migrations/20260929080000_create_open_source_app_builder_core.sql', import.meta.url), 'utf8');
const researchFn = await readFile(new URL('../supabase/functions/research-open-source/index.ts', import.meta.url), 'utf8');
const generateFn = await readFile(new URL('../supabase/functions/generate-app/index.ts', import.meta.url), 'utf8');
const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
const wrangler = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');

test('product is the open-source-first app builder', () => {
  assert.match(html, /Open Source App Builder/);
  assert.match(html, /Create project & research open source/);
  assert.match(html, /Generate source bundle/);
  assert.doesNotMatch(html, /TimesFM Research Workspace/);
});

test('the full engineering pipeline is visible', () => {
  for (const stage of ['inspect','research','license','understand','integrate','build','test','verify']) {
    assert.match(html, new RegExp(`data-stage="${stage}"`));
  }
});

test('browser workflow persists projects, research, decisions, and artifacts', () => {
  assert.match(js, /from\('builder_projects'\)/);
  assert.match(js, /from\('oss_candidates'\)/);
  assert.match(js, /from\('integration_decisions'\)/);
  assert.match(js, /from\('builder_artifacts'\)/);
  assert.match(js, /signInAnonymously/);
});

test('research function performs real GitHub discovery with license handling', () => {
  assert.match(researchFn, /api\.github\.com\/search\/repositories/);
  assert.match(researchFn, /classifyLicense/);
  assert.match(researchFn, /permissive/);
  assert.match(researchFn, /reciprocal/);
  assert.match(researchFn, /restricted/);
});

test('generation function uses Hugging Face and refuses fake verification', () => {
  assert.match(generateFn, /router\.huggingface\.co\/v1\/chat\/completions/);
  assert.match(generateFn, /OPEN_SOURCE_COMPONENTS\.md/);
  assert.match(generateFn, /verification_state: "unverified"/);
  assert.match(generateFn, /maximum 35 files/i);
});

test('builder schema uses ownership RLS', () => {
  for (const table of ['builder_projects','build_runs','oss_candidates','integration_decisions','builder_artifacts']) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(migration, /auth\.uid\(\)\) = user_id/);
  assert.match(migration, /revoke all on table public\.builder_projects from anon/);
});

test('build embeds only public Supabase configuration', () => {
  assert.match(build, /__OPEN_SOURCE_APP_BUILDER_CONFIG__/);
  assert.match(build, /SUPABASE_URL/);
  assert.match(build, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(build, /service\[_-\]\?role/);
});

test('Cloudflare deploys dist as Worker static assets with constrained CSP', () => {
  assert.match(wrangler, /"name": "open-source-app-builder"/);
  assert.match(wrangler, /"directory": "\.\/dist"/);
  assert.match(headers, /script-src 'self' https:\/\/cdn\.jsdelivr\.net/);
  assert.match(headers, /connect-src 'self' https:\/\/\*\.supabase\.co/);
  assert.doesNotMatch(headers, /hari31416-ts-foundation-lab/);
});
