import http from 'node:http';

const env = process.env;
const port = Number(env.PORT || 8090);
const socketPath = env.DOCKER_SOCKET || '/var/run/docker.sock';
const api = '/' + (env.DOCKER_API_VERSION || 'v1.47').replace(/^\//, '');

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
  return Boolean(env.RUNTIME_AGENT_TOKEN) &&
    req.headers.authorization === 'Bearer ' + env.RUNTIME_AGENT_TOKEN;
}

function docker(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : Buffer.from(JSON.stringify(body));
    const request = http.request({
      socketPath,
      method,
      path: api + path,
      headers: payload ? {
        'content-type': 'application/json',
        'content-length': payload.length
      } : {}
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (response.statusCode >= 200 && response.statusCode < 300) {
          try {
            resolve(raw ? JSON.parse(raw) : null);
          } catch {
            resolve(raw);
          }
        } else {
          reject(new Error('docker ' + response.statusCode + ': ' + raw.slice(0, 500)));
        }
      });
    });
    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}

function validSlug(value) {
  return typeof value === 'string' &&
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value);
}

function validImage(value) {
  return typeof value === 'string' &&
    value.length <= 240 &&
    /^[a-z0-9][a-z0-9._/-]*(?::[A-Za-z0-9._-]+)?$/i.test(value);
}

function safeEnv(object) {
  const result = [];
  for (const [key, value] of Object.entries(object || {})) {
    if (!/^[A-Z_][A-Z0-9_]{0,127}$/.test(key)) {
      throw new Error('invalid env key: ' + key);
    }
    const text = String(value);
    if (text.length > 4000) throw new Error('env value too long: ' + key);
    result.push(key + '=' + text);
  }
  return result;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://runtime.local');

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { ok: true });
    }

    if (!authorized(req)) {
      return sendJson(res, 401, { error: 'unauthorized' });
    }

    if (req.method === 'POST' && url.pathname === '/v1/deployments') {
      const body = await readJson(req);
      const image = String(body.image || '').trim();
      const projectSlug = String(body.project_slug || '').trim();
      const subdomain = String(body.subdomain || projectSlug).trim();
      const containerPort = Number(body.container_port || 3000);

      if (!validImage(image) || !validSlug(projectSlug) || !validSlug(subdomain) ||
          !Number.isInteger(containerPort) || containerPort < 1 || containerPort > 65535) {
        return sendJson(res, 400, { error: 'invalid deployment request' });
      }

      await docker('POST', '/images/create?fromImage=' + encodeURIComponent(image));

      const router = 'app-' + projectSlug + '-' + Date.now().toString(36);
      const host = subdomain + '.' + env.BASE_DOMAIN;
      const portKey = String(containerPort) + '/tcp';
      const labels = {
        'devcloud.managed': 'true',
        'devcloud.project': String(body.project_id || ''),
        'traefik.enable': 'true'
      };

      labels['traefik.http.routers.' + router + '.rule'] = 'Host(\`' + host + '\`)';
      labels['traefik.http.routers.' + router + '.entrypoints'] =
        env.TRAEFIK_CERTRESOLVER ? 'websecure' : 'web';
      labels['traefik.http.services.' + router + '.loadbalancer.server.port'] =
        String(containerPort);

      if (env.TRAEFIK_CERTRESOLVER) {
        labels['traefik.http.routers.' + router + '.tls.certresolver'] =
          env.TRAEFIK_CERTRESOLVER;
      }

      const created = await docker(
        'POST',
        '/containers/create?name=' + encodeURIComponent(router),
        {
          Image: image,
          Env: safeEnv(body.env),
          ExposedPorts: { [portKey]: {} },
          Labels: labels,
          HostConfig: {
            NetworkMode: env.RUNTIME_NETWORK || 'devcloud',
            RestartPolicy: { Name: 'unless-stopped' }
          }
        }
      );

      await docker('POST', '/containers/' + created.Id + '/start');

      return sendJson(res, 201, {
        container_id: created.Id,
        host,
        url: (env.PUBLIC_SCHEME || 'http') + '://' + host
      });
    }

    const match = url.pathname.match(/^\/v1\/deployments\/([a-f0-9]+)$/i);

    if (match && req.method === 'DELETE') {
      const inspected = await docker('GET', '/containers/' + match[1] + '/json');
      if (!inspected || !inspected.Config || !inspected.Config.Labels ||
          inspected.Config.Labels['devcloud.managed'] !== 'true') {
        return sendJson(res, 403, { error: 'container is not managed by devcloud' });
      }

      await docker('POST', '/containers/' + match[1] + '/stop?t=10').catch(() => null);
      await docker('DELETE', '/containers/' + match[1] + '?v=true');

      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 404, { error: 'not found' });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'runtime error'
    });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log('runtime agent listening on :' + port);
});
