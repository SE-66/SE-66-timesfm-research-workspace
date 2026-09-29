import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = await readFile(resolve(root, 'src', 'index.html'), 'utf8');
const js = await readFile(resolve(root, 'src', 'main.js'), 'utf8');
const css = await readFile(resolve(root, 'src', 'styles.css'), 'utf8');
const build = await readFile(resolve(root, 'scripts', 'build.mjs'), 'utf8');
const headers = await readFile(resolve(root, 'public', '_headers'), 'utf8');
const wrangler = await readFile(resolve(root, 'wrangler.jsonc'), 'utf8');
const controlPlane = await readFile(resolve(root, 'platform', 'control-plane', 'src', 'server.mjs'), 'utf8');
const compose = await readFile(resolve(root, 'platform', 'docker-compose.yml'), 'utf8');

for (const marker of [
  'DevCloud',
  'SELF-HOSTED DEVELOPER CLOUD',
  'Create a project and private Git repository',
  'Projects and deployments',
  'Gitea',
  'Supabase',
  'Traefik'
]) {
  if (!html.includes(marker)) throw new Error(`Missing DevCloud HTML marker: ${marker}`);
}

if (html.includes('Open Source App Builder')) {
  throw new Error('Old app-builder product UI must not remain in the deployed root page.');
}
if (html.includes('@supabase/supabase-js') || html.includes('jszip')) {
  throw new Error('The DevCloud console must not load obsolete browser dependencies.');
}

for (const endpoint of [
  "/api/health",
  "/api/services",
  "/api/projects",
  "/deployments"
]) {
  if (!js.includes(endpoint)) throw new Error(`Missing DevCloud API integration: ${endpoint}`);
}

if (!js.includes('sessionStorage')) throw new Error('Admin token must remain session-scoped in the browser.');
if (!js.includes('CONTROL_PLANE_API_TOKEN')) throw new Error('Console must identify the required admin credential.');
if (!build.includes('__DEV_CLOUD_CONFIG__')) throw new Error('Build must emit DevCloud public configuration.');
if (!build.includes('DEV_CLOUD_API_URL')) throw new Error('Build must accept the DevCloud API origin.');
if (!build.includes("parsed.protocol !== 'https:'")) throw new Error('Production API configuration must require HTTPS.');
if (!build.includes('__DEV_CLOUD_CONNECT_SRC__')) throw new Error('Build must constrain CSP to the configured API origin.');

if (!headers.includes("script-src 'self'")) throw new Error('DevCloud CSP must use first-party scripts only.');
if (!headers.includes("connect-src 'self'__DEV_CLOUD_CONNECT_SRC__")) {
  throw new Error('DevCloud CSP must restrict network access to the configured control plane.');
}
if (headers.includes('cdn.jsdelivr.net') || headers.includes('*.supabase.co')) {
  throw new Error('Obsolete app-builder CSP origins must be removed.');
}

if (!controlPlane.includes("'/api/v1/user/repos'")) throw new Error('Control plane must create real Gitea repositories.');
if (!controlPlane.includes("'/v1/deployments'")) throw new Error('Control plane must use the runtime deployment adapter.');
if (!compose.includes('gitea/gitea:1.27.3')) throw new Error('Pinned Gitea service is missing.');
if (!compose.includes('traefik:v3.7.13')) throw new Error('Pinned Traefik service is missing.');

if (!wrangler.includes('"assets"') || !wrangler.includes('"directory": "./dist"')) {
  throw new Error('Missing Cloudflare Workers static asset configuration.');
}
if (!css.includes('@media (max-width: 760px)')) throw new Error('Missing responsive breakpoint.');
if (/service[_-]?role|sb_secret_/i.test(html + js)) {
  throw new Error('Privileged credentials must not appear in browser source.');
}

console.log('Repository verification passed.');
