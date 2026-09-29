import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

const devCloudApiUrl = process.env.DEV_CLOUD_API_URL?.trim().replace(/\/+$/, '') ?? '';

let apiOrigin = '';
if (devCloudApiUrl) {
  let parsed;
  try {
    parsed = new URL(devCloudApiUrl);
  } catch {
    throw new Error('DEV_CLOUD_API_URL must be a valid absolute URL.');
  }

  const localHttp =
    parsed.protocol === 'http:' &&
    (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');

  if (parsed.protocol !== 'https:' && !localHttp) {
    throw new Error('DEV_CLOUD_API_URL must use HTTPS, except for localhost development.');
  }

  if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('DEV_CLOUD_API_URL must be an origin without a path, query, or fragment.');
  }

  apiOrigin = parsed.origin;
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, 'src', 'index.html'), resolve(dist, 'index.html'));
await cp(resolve(root, 'src', 'styles.css'), resolve(dist, 'styles.css'));
await cp(resolve(root, 'src', 'main.js'), resolve(dist, 'main.js'));
await cp(resolve(root, 'public'), dist, { recursive: true });

const configSource =
  'globalThis.__DEV_CLOUD_CONFIG__ = Object.freeze(' +
  JSON.stringify({
    devCloudApiUrl,
    sourceRepository: 'https://github.com/SE-66/SE-66-timesfm-research-workspace'
  }) +
  ');\n';

await writeFile(resolve(dist, 'config.js'), configSource, 'utf8');

const headersPath = resolve(dist, '_headers');
const headersSource = await readFile(headersPath, 'utf8');
const connectSource = apiOrigin ? ' ' + apiOrigin : '';
await writeFile(
  headersPath,
  headersSource.replace('__DEV_CLOUD_CONNECT_SRC__', connectSource),
  'utf8'
);

console.log(
  'Built DevCloud console to dist/ (control-plane API ' +
  (devCloudApiUrl ? 'configured' : 'not configured') +
  ').'
);
