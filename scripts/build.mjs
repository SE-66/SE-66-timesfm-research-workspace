import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? '';
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

if (Boolean(supabaseUrl) !== Boolean(supabasePublishableKey)) {
  throw new Error('Set both SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY, or neither.');
}
if (supabaseUrl && !/^https:\/\/[a-zA-Z0-9.-]+\.supabase\.co\/?$/.test(supabaseUrl)) {
  throw new Error('SUPABASE_URL must be an https://*.supabase.co project URL.');
}
if (/service[_-]?role/i.test(supabasePublishableKey)) {
  throw new Error('Refusing to embed a service-role credential in browser output.');
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, 'src', 'index.html'), resolve(dist, 'index.html'));
await cp(resolve(root, 'src', 'styles.css'), resolve(dist, 'styles.css'));
await cp(resolve(root, 'src', 'main.js'), resolve(dist, 'main.js'));
await cp(resolve(root, 'public'), dist, { recursive: true });

const configSource = `globalThis.__OPEN_SOURCE_APP_BUILDER_CONFIG__ = Object.freeze(${JSON.stringify({
  supabaseUrl,
  supabasePublishableKey,
})});\n`;
await writeFile(resolve(dist, 'config.js'), configSource, 'utf8');

console.log(`Built static site to dist/ (Supabase ${supabaseUrl ? 'enabled' : 'disabled'}).`);
