import http from 'node:http';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { validImage, validPort, validSlug } from './validation.mjs';

const env = process.env;
const port = Number(env.PORT || 8080);
const dataDir = env.DATA_DIR || '/data';
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, 'devcloud.sqlite'));
db.exec(
  'PRAGMA foreign_keys=ON;' +
  'PRAGMA journal_mode=WAL;' +
  'PRAGMA busy_timeout=5000;' +
  'CREATE TABLE IF NOT EXISTS projects (' +
  'id TEXT PRIMARY KEY,' +
  'slug TEXT NOT NULL UNIQUE,' +
  'name TEXT NOT NULL,' +
  'description TEXT NOT NULL DEFAULT "",' +
  'repo_url TEXT NOT NULL,' +
  'created_at TEXT NOT NULL' +
  ');' +
  'CREATE TABLE IF NOT EXISTS deployments (' +
  'id TEXT PRIMARY KEY,' +
  'project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,' +
  'container_id TEXT NOT NULL,' +
  'image TEXT NOT NULL,' +
  'host TEXT NOT NULL,' +
  'url TEXT NOT NULL,' +
  'status TEXT NOT NULL,' +
  'created_at TEXT NOT NULL' +
  ');'
);

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store'
  });
  res.end(payload);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 256000) throw new Error('request too large');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function authorized(req) {
  const expected = env.CONTROL_PLANE_API_TOKEN || '';
  return Boolean(expected) && req.headers.authorization === 'Bearer ' + expected;
}

async function gitea(path, options = {}) {
  if (!env.GITEA_TOKEN) throw new Error('GITEA_TOKEN is not configured');
  const response = await fetch(env.GITEA_BASE_URL + path, {
    ...options,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: 'token ' + env.GITEA_TOKEN,
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error('Gitea ' + response.status + ': ' + detail.slice(0, 300));
  }
  return response.status === 204 ? null : response.json();
}

async function runtime(path, options = {}) {
  const response = await fetch(env.RUNTIME_AGENT_URL + path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + env.RUNTIME_AGENT_TOKEN,
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'runtime agent ' + response.status);
  return payload;
}

async function serviceHealth() {
  const result = { control_plane: 'ok', gitea: 'unknown', runtime: 'unknown' };
  try {
    const response = await fetch(env.GITEA_BASE_URL + '/api/v1/version');
    result.gitea = response.ok ? 'ok' : 'http-' + response.status;
  } catch {
    result.gitea = 'unreachable';
  }
  try {
    const response = await fetch(env.RUNTIME_AGENT_URL + '/health');
    result.runtime = response.ok ? 'ok' : 'http-' + response.status;
  } catch {
    result.runtime = 'unreachable';
  }
  return result;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://control-plane.local');

    if (req.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(res, 200, await serviceHealth());
    }

    if (!url.pathname.startsWith('/api/')) {
      return sendJson(res, 404, { error: 'not found' });
    }

    if (!authorized(req)) {
      return sendJson(res, 401, { error: 'unauthorized' });
    }

    if (req.method === 'GET' && url.pathname === '/api/services') {
      return sendJson(res, 200, {
        git: env.GITEA_PUBLIC_URL,
        supabase_api: env.SUPABASE_API_URL,
        supabase_studio: env.SUPABASE_STUDIO_URL
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/projects') {
      const rows = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
      return sendJson(res, 200, { projects: rows });
    }

    if (req.method === 'POST' && url.pathname === '/api/projects') {
      const body = await readJson(req);
      const name = String(body.name || '').trim();
      const slug = String(body.slug || '').trim().toLowerCase();
      const description = String(body.description || '').trim().slice(0, 2000);

      if (!name || name.length > 120 || !validSlug(slug)) {
        return sendJson(res, 400, { error: 'name and a valid lowercase slug are required' });
      }

      if (db.prepare('SELECT 1 FROM projects WHERE slug=?').get(slug)) {
        return sendJson(res, 409, { error: 'project slug already exists' });
      }

      const repo = await gitea('/api/v1/user/repos', {
        method: 'POST',
        body: JSON.stringify({
          name: slug,
          description,
          private: true,
          auto_init: true,
          default_branch: 'main'
        })
      });

      const project = {
        id: randomUUID(),
        slug,
        name,
        description,
        repo_url: repo.html_url || (env.GITEA_PUBLIC_URL + '/' + env.GITEA_OWNER + '/' + slug),
        created_at: new Date().toISOString()
      };

      db.prepare(
        'INSERT INTO projects(id,slug,name,description,repo_url,created_at) ' +
        'VALUES(@id,@slug,@name,@description,@repo_url,@created_at)'
      ).run(project);

      return sendJson(res, 201, project);
    }

    const deploymentMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/deployments$/);

    if (deploymentMatch && req.method === 'GET') {
      const rows = db.prepare(
        'SELECT * FROM deployments WHERE project_id=? ORDER BY created_at DESC'
      ).all(deploymentMatch[1]);
      return sendJson(res, 200, { deployments: rows });
    }

    if (deploymentMatch && req.method === 'POST') {
      const project = db.prepare('SELECT * FROM projects WHERE id=?').get(deploymentMatch[1]);
      if (!project) return sendJson(res, 404, { error: 'project not found' });

      const body = await readJson(req);
      const image = String(body.image || '').trim();
      const containerPort = Number(body.container_port || 3000);
      const subdomain = String(body.subdomain || project.slug).trim().toLowerCase();

      if (!validImage(image) || !validPort(containerPort) || !validSlug(subdomain)) {
        return sendJson(res, 400, { error: 'invalid image, port, or subdomain' });
      }

      const deployed = await runtime('/v1/deployments', {
        method: 'POST',
        body: JSON.stringify({
          project_id: project.id,
          project_slug: project.slug,
          image,
          container_port: containerPort,
          subdomain,
          env: body.env && typeof body.env === 'object' ? body.env : {}
        })
      });

      const row = {
        id: randomUUID(),
        project_id: project.id,
        container_id: deployed.container_id,
        image,
        host: deployed.host,
        url: deployed.url,
        status: 'running',
        created_at: new Date().toISOString()
      };

      db.prepare(
        'INSERT INTO deployments(id,project_id,container_id,image,host,url,status,created_at) ' +
        'VALUES(@id,@project_id,@container_id,@image,@host,@url,@status,@created_at)'
      ).run(row);

      return sendJson(res, 201, row);
    }

    const deleteMatch = url.pathname.match(/^\/api\/deployments\/([^/]+)$/);

    if (deleteMatch && req.method === 'DELETE') {
      const deployment = db.prepare('SELECT * FROM deployments WHERE id=?').get(deleteMatch[1]);
      if (!deployment) return sendJson(res, 404, { error: 'deployment not found' });

      await runtime('/v1/deployments/' + encodeURIComponent(deployment.container_id), {
        method: 'DELETE'
      });
      db.prepare("UPDATE deployments SET status='stopped' WHERE id=?").run(deployment.id);
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 404, { error: 'not found' });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'internal error'
    });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log('devcloud control plane listening on :' + port);
});
