const select = (value) => document.querySelector(value);
const tokenInput = select('#token');
const health = select('#health');
const services = select('#services');
const projects = select('#projects');

tokenInput.value = sessionStorage.getItem('devcloud-token') || '';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeHref(value) {
  try {
    const url = new URL(String(value), window.location.origin);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
  } catch {}
  return '#';
}

function headers() {
  return {
    'content-type': 'application/json',
    authorization: 'Bearer ' + (sessionStorage.getItem('devcloud-token') || '')
  };
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || ('HTTP ' + response.status));
  return payload;
}

async function checkHealth() {
  const payload = await fetch('/api/health').then((response) => response.json());
  health.textContent =
    'control ' + payload.control_plane +
    ' · git ' + payload.gitea +
    ' · runtime ' + payload.runtime;
}

async function loadServices() {
  try {
    const payload = await api('/api/services');
    services.innerHTML = Object.entries(payload).map(([key, value]) =>
      '<a class="card" href="' + safeHref(value) + '" target="_blank" rel="noopener noreferrer">' +
      '<strong>' + escapeHtml(key.replaceAll('_', ' ')) + '</strong><br><small>' +
      escapeHtml(value) + '</small></a>'
    ).join('');
  } catch (error) {
    services.textContent = error.message;
  }
}

async function loadDeployments(element) {
  try {
    const payload = await api('/api/projects/' + encodeURIComponent(element.dataset.id) + '/deployments');
    element.querySelector('.deployments').innerHTML = payload.deployments.map((deployment) =>
      '<p><a href="' + safeHref(deployment.url) + '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(deployment.url) + '</a> · ' + escapeHtml(deployment.image) +
      ' · ' + escapeHtml(deployment.status) + '</p>'
    ).join('');
  } catch {
    element.querySelector('.deployments').textContent = 'Could not load deployments.';
  }
}

async function deploy(element) {
  const image = element.querySelector('.image').value.trim();
  const containerPort = Number(element.querySelector('.port').value);
  if (!image) return;

  try {
    await api('/api/projects/' + encodeURIComponent(element.dataset.id) + '/deployments', {
      method: 'POST',
      body: JSON.stringify({ image, container_port: containerPort })
    });
    await loadDeployments(element);
  } catch (error) {
    window.alert(error.message);
  }
}

async function loadProjects() {
  try {
    const payload = await api('/api/projects');
    if (!payload.projects.length) {
      projects.innerHTML = '<p>No projects yet.</p>';
      return;
    }

    projects.innerHTML = payload.projects.map((project) =>
      '<article class="project" data-id="' + escapeHtml(project.id) + '">' +
      '<div class="heading"><div><strong>' + escapeHtml(project.name) + '</strong>' +
      '<div><a href="' + safeHref(project.repo_url) + '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(project.repo_url) + '</a></div></div>' +
      '<span class="status">' + escapeHtml(project.slug) + '</span></div>' +
      '<p>' + escapeHtml(project.description || '') + '</p>' +
      '<div class="project-actions">' +
      '<input class="image" placeholder="public image, e.g. nginx:1.28-alpine">' +
      '<input class="port" type="number" value="80" min="1" max="65535">' +
      '<button class="deploy">Deploy image</button>' +
      '</div><div class="deployments"></div></article>'
    ).join('');

    for (const element of document.querySelectorAll('.project')) {
      element.querySelector('.deploy').addEventListener('click', () => deploy(element));
      loadDeployments(element);
    }
  } catch (error) {
    projects.textContent = error.message;
  }
}

select('#save-token').addEventListener('click', () => {
  sessionStorage.setItem('devcloud-token', tokenInput.value);
  loadServices();
  loadProjects();
});

select('#refresh-services').addEventListener('click', loadServices);
select('#refresh-projects').addEventListener('click', loadProjects);

select('#project-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: select('#project-name').value,
        slug: select('#project-slug').value,
        description: select('#project-description').value
      })
    });
    select('#project-message').textContent = 'Project and Git repository created.';
    event.target.reset();
    loadProjects();
  } catch (error) {
    select('#project-message').textContent = error.message;
  }
});

checkHealth();
if (tokenInput.value) {
  loadServices();
  loadProjects();
}
