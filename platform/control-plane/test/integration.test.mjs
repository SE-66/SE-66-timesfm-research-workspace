import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function listen(handler) {
  const server = http.createServer(handler);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  return {
    server,
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

async function freePort() {
  const probe = http.createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

async function jsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

async function waitFor(url, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError ?? new Error('service did not become ready');
}

test('control plane project and deployment flow works against service adapters', async (t) => {
  const calls = { repos: [], deploys: [], deletes: [] };

  const gitea = await listen(async (req, res) => {
    if (req.method === 'GET' && req.url === '/api/v1/version') {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ version: 'test' }));
    }

    if (req.method === 'POST' && req.url === '/api/v1/user/repos') {
      assert.equal(req.headers.authorization, 'token test-gitea-token');
      const body = await jsonBody(req);
      calls.repos.push(body);
      res.writeHead(201, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({
        html_url: `http://git.test/devcloud/${body.name}`
      }));
    }

    res.writeHead(404);
    res.end();
  });

  const runtime = await listen(async (req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: true }));
    }

    if (req.method === 'POST' && req.url === '/v1/deployments') {
      assert.equal(req.headers.authorization, 'Bearer test-runtime-token');
      const body = await jsonBody(req);
      calls.deploys.push(body);
      res.writeHead(201, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({
        container_id: 'abc123',
        host: `${body.subdomain}.dev.test`,
        url: `http://${body.subdomain}.dev.test`
      }));
    }

    if (req.method === 'DELETE' && req.url === '/v1/deployments/abc123') {
      calls.deletes.push(req.url);
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: true }));
    }

    res.writeHead(404);
    res.end();
  });

  const dataDir = await mkdtemp(join(tmpdir(), 'devcloud-control-plane-'));
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;

  const child = spawn(process.execPath, ['src/server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: dataDir,
      CONTROL_PLANE_API_TOKEN: 'test-admin-token',
      DASHBOARD_ORIGINS: 'http://console.test',
      GITEA_BASE_URL: gitea.origin,
      GITEA_PUBLIC_URL: 'http://git.test',
      GITEA_TOKEN: 'test-gitea-token',
      GITEA_OWNER: 'devcloud',
      RUNTIME_AGENT_URL: runtime.origin,
      RUNTIME_AGENT_TOKEN: 'test-runtime-token',
      BASE_DOMAIN: 'dev.test',
      PUBLIC_SCHEME: 'http',
      SUPABASE_API_URL: 'http://supabase.dev.test',
      SUPABASE_STUDIO_URL: 'http://db.dev.test'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  t.after(async () => {
    child.kill('SIGTERM');
    await Promise.race([
      new Promise((resolve) => child.once('exit', resolve)),
      new Promise((resolve) => setTimeout(resolve, 1500))
    ]);
    await Promise.allSettled([
      gitea.close(),
      runtime.close(),
      rm(dataDir, { recursive: true, force: true })
    ]);
  });

  await waitFor(`${origin}/api/health`);

  const health = await fetch(`${origin}/api/health`).then((response) => response.json());
  assert.deepEqual(health, {
    control_plane: 'ok',
    gitea: 'ok',
    runtime: 'ok'
  });

  const unauthorized = await fetch(`${origin}/api/projects`);
  assert.equal(unauthorized.status, 401);

  const preflight = await fetch(`${origin}/api/projects`, {
    method: 'OPTIONS',
    headers: {
      origin: 'http://console.test',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'authorization,content-type'
    }
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://console.test');

  const headers = {
    authorization: 'Bearer test-admin-token',
    'content-type': 'application/json',
    origin: 'http://console.test'
  };

  const createdResponse = await fetch(`${origin}/api/projects`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Smoke Test App',
      slug: 'smoke-test-app',
      description: 'Created by the DevCloud integration smoke test.'
    })
  });
  assert.equal(createdResponse.status, 201, stderr);
  assert.equal(createdResponse.headers.get('access-control-allow-origin'), 'http://console.test');
  const project = await createdResponse.json();
  assert.equal(project.slug, 'smoke-test-app');
  assert.equal(project.repo_url, 'http://git.test/devcloud/smoke-test-app');
  assert.equal(calls.repos.length, 1);
  assert.equal(calls.repos[0].private, true);
  assert.equal(cals.repos[0].auto_init, true);

  const projectsResponse = await fetch(`${origin}/api/projects`, { headers });
  assert.equal(projectsResponse.status, 200);
  const projects = await projectsResponse.json();
  assert.equal(projects.projects.length, 1);
  assert.equal(projects.projects[0].id, project.id);

  const deployResponse = await fetch(`${origin}/api/projects/${project.id}/deployments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      image: 'nginx:1.28-alpine',
      container_port: 80
    })
  });
  assert.equal(deployResponse.status, 201, stderr);
  const deployment = await deployResponse.json();
  assert.equal(deployment.image, 'nginx:1.28-alpine');
  assert.equal(deployment.url, 'http://smoke-test-app.dev.test');
  assert.equal(calls.deploys.length, 1);
  assert.equal(calls.deploys[0].project_slug, 'smoke-test-app');
  assert.equal(calls.deploys[0].container_port, 80);

  const deploymentListResponse = await fetch(`${origin}/api/projects/${project.id}/deployments`, { headers });
  assert.equal(deploymentListResponse.status, 200);
  const deploymentList = await deploymentListResponse.json();
  assert.equal(deploymentList.deployments.length, 1);
  assert.equal(deploymentList.deployments[0].status, 'running');

  const stopResponse = await fetch(`${origin}/api/deployments/${deployment.id}`, {
    method: 'DELETE',
    headers
  });
  assert.equal(stopResponse.status, 200, stderr);
  assert.deepEqual(await stopResponse.json(), { ok: true });
  assert.deepEqual(calls.deletes, ['/v1/deployments/abc123']);

  const stoppedList = await fetch(`${origin}/api/projects/${project.id}/deployments`, { headers })
    .then((response) => response.json());
  assert.equal(stoppedList.deployments[0].status, 'stopped');
});
