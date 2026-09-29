import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../src/index.html', import.meta.url), 'utf8');
const js = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const build = await readFile(new URL('../scripts/build.mjs', import.meta.url), 'utf8');
const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
const wrangler = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
const controlPlane = await readFile(new URL('../platform/control-plane/src/server.mjs', import.meta.url), 'utf8');
const runtime = await readFile(new URL('../platform/runtime-agent/server.mjs', import.meta.url), 'utf8');
const compose = await readFile(new URL('../platform/docker-compose.yml', import.meta.url), 'utf8');

test('deployed product is the DevCloud control console', () => {
  assert.match(html, /DevCloud/);
  assert.match(html, /SELF-HOSTED DEVELOPER CLOUD/);
  assert.match(html, /Create a project and private Git repository/);
  assert.match(html, /Projects and deployments/);
  assert.doesNotMatch(html, /Open Source App Builder/);
});

test('browser console uses the real control-plane API surface', () => {
  assert.match(js, /\/api\/health/);
  assert.match(js, /\/api\/services/);
  assert.match(js, /\/api\/projects/);
  assert.match(js, /\/deployments/);
  assert.match(js, /method: 'DELETE'/);
  assert.match(js, /sessionStorage/);
  assert.match(js, /CONTROL_PLANE_API_TOKEN/);
  assert.doesNotMatch(js, /supabase\.createClient/);
});

test('build exposes only a public DevCloud API origin', () => {
  assert.match(build, /__DEV_CLOUD_CONFIG__/);
  assert.match(build, /DEV_CLOUD_API_URL/);
  assert.match(build, /parsed\.protocol !== 'https:'/);
  assert.match(build, /__DEV_CLOUD_CONNECT_SRC__/);
  assert.doesNotMatch(build, /SUPABASE_PUBLISHABLE_KEY/);
});

test('Cloudflare deploy remains static assets with a constrained CSP', () => {
  assert.match(wrangler, /"directory": "\.\/dist"/);
  assert.match(headers, /script-src 'self'/);
  assert.match(headers, /connect-src 'self'__DEV_CLOUD_CONNECT_SRC__/);
  assert.doesNotMatch(headers, /cdn\.jsdelivr\.net/);
  assert.doesNotMatch(headers, /\*\.supabase\.co/);
});

test('control plane creates repositories and delegates runtime deployment', () => {
  assert.match(controlPlane, /\/api\/v1\/user\/repos/);
  assert.match(controlPlane, /\/v1\/deployments/);
  assert.match(controlPlane, /CREATE TABLE IF NOT EXISTS projects/);
  assert.match(controlPlane, /CREATE TABLE IF NOT EXISTS deployments/);
});

test('runtime adapter validates and labels managed containers', () => {
  assert.match(runtime, /devcloud\.managed/);
  assert.match(runtime, /invalid deployment request/);
  assert.match(runtime, /NetworkMode/);
  assert.match(runtime, /traefik\.http\.routers/);
});

test('compose stack pins the open-source service layer', () => {
  assert.match(compose, /gitea\/gitea:1\.27\.3/);
  assert.match(compose, /traefik:v3\.7\.13/);
  assert.match(compose, /runtime-agent/);
  assert.match(compose, /control-plane/);
});
