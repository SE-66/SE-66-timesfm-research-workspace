const cfg = globalThis.__DEV_CLOUD_CONFIG__ ?? {};
const apiBase = String(cfg.devCloudApiUrl ?? '').trim().replace(/\/+$/, '');

const $ = (selector) => document.querySelector(selector);
const ui = {
  state: $('#platform-state'),
  apiUrl: $('#api-url'),
  apiHelp: $('#api-help'),
  token: $('#admin-token'),
  connect: $('#connect-button'),
  accessMessage: $('#access-message'),
  gitState: $('#git-service-state'),
  services: $('#service-list'),
  form: $('#project-form'),
  name: $('#project-name'),
  slug: $('#project-slug'),
  description: $('#project-description'),
  create: $('#create-project-button'),
  projectMessage: $('#project-message'),
  refresh: $('#refresh-projects'),
  projects: $('#project-list')
};

const TOKEN_KEY = 'devcloud-admin-token';
let slugEdited = false;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeHttpUrl(value) {
  try {
    const parsed = new URL(String(value));
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '#';
  } catch {
    return '#';
  }
}

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

function setMessage(element, value, error = false) {
  element.textContent = value;
  element.dataset.error = String(error);
}

function setBusy(button, active, activeText = 'Working…') {
  button.dataset.idle ??= button.textContent;
  button.disabled = active;
  button.textContent = active ? activeText : button.dataset.idle;
}

function setConnectedControls(enabled) {
  ui.create.disabled = !enabled;
  ui.refresh.disabled = !enabled;
  ui.name.disabled = !enabled;
  ui.slug.disabled = !enabled;
  ui.description.disabled = !enabled;
}

function token() {
  return sessionStorage.getItem(TOKEN_KEY) ?? '';
}

async function request(path, options = {}, needsAuth = true) {
  if (!apiBase) throw new Error('DEV_CLOUD_API_URL is not configured for this deployment.');

  const headers = {
    accept: 'application/json',
    ...(options.body ? { 'content-type': 'application/json' } : {}),
    ...(options.headers ?? {})
  };

  if (needsAuth) {
    const value = token();
    if (!value) throw new Error('Enter the control-plane admin token first.');
    headers.authorization = 'Bearer ' + value;
  }

  const response = await fetch(apiBase + path, { ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || ('Control plane returned HTTP ' + response.status));
  }

  return payload;
}

async function checkHealth() {
  if (!apiBase) {
    ui.state.textContent = 'Control plane not configured';
    ui.state.dataset.state = 'warning';
    ui.gitState.textContent = 'Git unavailable';
    ui.gitState.dataset.state = 'warning';
    ui.apiUrl.value = 'Not configured';
    ui.apiHelp.textContent = 'Set DEV_CLOUD_API_URL in the Cloudflare build variables after the DevCloud server is online.';
    setConnectedControls(false);
    return;
  }

  ui.apiUrl.value = apiBase;
  ui.apiHelp.textContent = 'This public browser configuration contains only the API origin, never the admin token.';

  try {
    const health = await request('/api/health', {}, false);
    ui.state.textContent = health.control_plane === 'ok' ? 'Control plane online' : 'Control plane degraded';
    ui.state.dataset.state = health.control_plane === 'ok' ? 'ready' : 'warning';

    ui.gitState.textContent = health.gitea === 'ok' ? 'Git online' : 'Git ' + String(health.gitea || 'unknown');
    ui.gitState.dataset.state = health.gitea === 'ok' ? 'ready' : 'warning';

    setConnectedControls(Boolean(token()));
  } catch (error) {
    ui.state.textContent = 'Control plane unreachable';
    ui.state.dataset.state = 'error';
    ui.gitState.textContent = 'Git unknown';
    ui.gitState.dataset.state = 'error';
    setConnectedControls(false);
    setMessage(ui.accessMessage, error.message, true);
  }
}

async function loadServices() {
  const payload = await request('/api/services');
  const entries = Object.entries(payload).filter(([, value]) => value);

  ui.services.innerHTML = entries.length
    ? entries.map(([name, value]) => {
        const href = safeHttpUrl(value);
        return '<a class="service-card" href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer">' +
          '<strong>' + escapeHtml(name.replaceAll('_', ' ')) + '</strong>' +
          '<small>' + escapeHtml(value) + '</small></a>';
      }).join('')
    : '<p class="empty-state">No service endpoints were returned.</p>';
}

async function loadDeployments(projectId, target) {
  try {
    const payload = await request('/api/projects/' + encodeURIComponent(projectId) + '/deployments');

    target.innerHTML = payload.deployments?.length
      ? payload.deployments.map((deployment) => {
          const url = safeHttpUrl(deployment.url);
          return '<div class="deployment" data-deployment-id="' + escapeHtml(deployment.id) + '">' +
            '<div class="deployment-main"><a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(deployment.url) + '</a><small>' +
            escapeHtml(deployment.image) + ' · ' + escapeHtml(deployment.status) + '</small></div>' +
            (deployment.status === 'running'
              ? '<button class="danger-button stop-deployment" type="button">Stop</button>'
              : '') +
            '</div>';
        }).join('')
      : '<p class="empty-state">No deployments yet.</p>';

    for (const button of target.querySelectorAll('.stop-deployment')) {
      button.addEventListener('click', async () => {
        const deployment = button.closest('.deployment');
        setBusy(button, true, 'Stopping…');
        try {
          await request('/api/deployments/' + encodeURIComponent(deployment.dataset.deploymentId), {
            method: 'DELETE'
          });
          await loadDeployments(projectId, target);
        } catch (error) {
          window.alert(error.message);
          setBusy(button, false);
        }
      });
    }
  } catch (error) {
    target.innerHTML = '<p class="empty-state">' + escapeHtml(error.message) + '</p>';
  }
}

async function deploy(projectId, card) {
  const imageInput = card.querySelector('.deploy-image');
  const portInput = card.querySelector('.deploy-port');
  const button = card.querySelector('.deploy-button');
  const image = imageInput.value.trim();
  const containerPort = Number(portInput.value);

  if (!image) {
    window.alert('Enter a public OCI image reference.');
    return;
  }

  setBusy(button, true, 'Deploying…');

  try {
    await request('/api/projects/' + encodeURIComponent(projectId) + '/deployments', {
      method: 'POST',
      body: JSON.stringify({
        image,
        container_port: containerPort
      })
    });

    imageInput.value = '';
    await loadDeployments(projectId, card.querySelector('.deployment-list'));
  } catch (error) {
    window.alert(error.message);
  } finally {
    setBusy(button, false);
  }
}

async function loadProjects() {
  ui.projects.innerHTML = '<p class="empty-state">Loading projects…</p>';
  const payload = await request('/api/projects');

  if (!payload.projects?.length) {
    ui.projects.innerHTML = '<p class="empty-state">No DevCloud projects yet. Create one above.</p>';
    return;
  }

  ui.projects.innerHTML = payload.projects.map((project) => {
    const repoUrl = safeHttpUrl(project.repo_url);
    return '<article class="project-card" data-project-id="' + escapeHtml(project.id) + '">' +
      '<div class="project-card-head"><div><h3>' + escapeHtml(project.name) + '</h3>' +
      '<p>' + escapeHtml(project.description || 'No description.') + '</p></div>' +
      '<span class="project-slug">' + escapeHtml(project.slug) + '</span></div>' +
      '<div class="project-card-body">' +
      '<div class="repo-row"><strong>Repository</strong><a href="' + escapeHtml(repoUrl) +
      '" target="_blank" rel="noopener noreferrer">' + escapeHtml(project.repo_url) + '</a></div>' +
      '<div class="deploy-box"><strong>Deploy a public OCI image</strong>' +
      '<div class="deploy-grid"><input class="deploy-image" placeholder="nginx:1.28-alpine or ghcr.io/org/app:v1" />' +
      '<input class="deploy-port" type="number" min="1" max="65535" value="80" aria-label="Container port" /></div>' +
      '<div><button class="primary-button deploy-button" type="button">Deploy image</button></div></div>' +
      '<div class="deployment-list"><p class="empty-state">Loading deployments…</p></div>' +
      '</div></article>';
  }).join('');

  for (const card of ui.projects.querySelectorAll('.project-card')) {
    const projectId = card.dataset.projectId;
    card.querySelector('.deploy-button').addEventListener('click', () => deploy(projectId, card));
    loadDeployments(projectId, card.querySelector('.deployment-list'));
  }
}

async function connect() {
  const value = ui.token.value.trim();

  if (!apiBase) {
    setMessage(ui.accessMessage, 'The Cloudflare build does not have DEV_CLOUD_API_URL yet.', true);
    return;
  }

  if (!value) {
    setMessage(ui.accessMessage, 'Enter CONTROL_PLANE_API_TOKEN.', true);
    return;
  }

  sessionStorage.setItem(TOKEN_KEY, value);
  setBusy(ui.connect, true, 'Connecting…');

  try {
    await Promise.all([loadServices(), loadProjects()]);
    setConnectedControls(true);
    setMessage(ui.accessMessage, 'Connected. Admin token is stored for this browser tab only.');
  } catch (error) {
    sessionStorage.removeItem(TOKEN_KEY);
    setConnectedControls(false);
    setMessage(ui.accessMessage, error.message, true);
  } finally {
    setBusy(ui.connect, false);
  }
}

async function createProject(event) {
  event.preventDefault();

  setBusy(ui.create, true, 'Creating…');
  setMessage(ui.projectMessage, 'Creating private Gitea repository…');

  try {
    await request('/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: ui.name.value.trim(),
        slug: ui.slug.value.trim(),
        description: ui.description.value.trim()
      })
    });

    ui.form.reset();
    slugEdited = false;
    setMessage(ui.projectMessage, 'Project and private Git repository created.');
    await loadProjects();
  } catch (error) {
    setMessage(ui.projectMessage, error.message, true);
  } finally {
    setBusy(ui.create, false);
  }
}

ui.name.addEventListener('input', () => {
  if (!slugEdited) ui.slug.value = toSlug(ui.name.value);
});

ui.slug.addEventListener('input', () => {
  slugEdited = true;
});

ui.connect.addEventListener('click', connect);
ui.form.addEventListener('submit', createProject);
ui.refresh.addEventListener('click', () => loadProjects().catch((error) => {
  ui.projects.innerHTML = '<p class="empty-state">' + escapeHtml(error.message) + '</p>';
}));

ui.token.value = token();
setConnectedControls(false);
checkHealth().then(() => {
  if (apiBase && token()) {
    Promise.all([loadServices(), loadProjects()])
      .then(() => setConnectedControls(true))
      .catch((error) => setMessage(ui.accessMessage, error.message, true));
  }
});
