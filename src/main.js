const config = globalThis.__TIMESFM_RESEARCH_CONFIG__ ?? {};
const supabaseUrl = config.supabaseUrl?.trim();
const supabasePublishableKey = config.supabasePublishableKey?.trim();

const stateBadge = document.querySelector('#supabase-state');
const form = document.querySelector('#research-log-form');
const saveButton = document.querySelector('#save-entry');
const refreshButton = document.querySelector('#refresh-entries');
const formMessage = document.querySelector('#form-message');
const entriesRoot = document.querySelector('#research-entries');

let client = null;

function setState(label, state) {
  stateBadge.textContent = label;
  stateBadge.dataset.state = state;
}

function setMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.dataset.error = String(isError);
}

function setControlsEnabled(enabled) {
  saveButton.disabled = !enabled;
  refreshButton.disabled = !enabled;
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function renderEntries(entries) {
  entriesRoot.replaceChildren();

  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No research entries saved for this anonymous workspace yet.';
    entriesRoot.append(empty);
    return;
  }

  for (const entry of entries) {
    const article = document.createElement('article');
    article.className = 'research-entry';

    const head = document.createElement('div');
    head.className = 'entry-head';

    const label = document.createElement('div');
    const scenario = document.createElement('span');
    scenario.className = 'scenario-chip';
    scenario.textContent = entry.scenario;
    const title = document.createElement('h4');
    title.textContent = entry.title;
    label.append(scenario, title);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteEntry(entry.id));

    head.append(label, deleteButton);

    const meta = document.createElement('p');
    meta.className = 'entry-meta';
    meta.textContent = [entry.dataset_label || 'No dataset label', formatDate(entry.created_at)].join(' · ');

    const notes = document.createElement('p');
    notes.className = 'entry-notes';
    notes.textContent = entry.notes || 'No notes.';

    article.append(head, meta, notes);
    entriesRoot.append(article);
  }
}

async function ensureAnonymousSession() {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session) return sessionData.session;

  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

async function loadEntries() {
  entriesRoot.innerHTML = '<p class="empty-state">Loading research entries…</p>';
  const { data, error } = await client
    .from('research_entries')
    .select('id,title,scenario,dataset_label,notes,created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  renderEntries(data ?? []);
}

async function deleteEntry(id) {
  setMessage('Deleting…');
  const { error } = await client.from('research_entries').delete().eq('id', id);
  if (error) {
    setMessage(error.message, true);
    return;
  }
  setMessage('Entry deleted.');
  await loadEntries();
}

async function saveEntry(event) {
  event.preventDefault();
  setMessage('Saving…');
  saveButton.disabled = true;

  const payload = {
    title: document.querySelector('#entry-title').value.trim(),
    scenario: document.querySelector('#entry-scenario').value,
    dataset_label: document.querySelector('#entry-dataset').value.trim(),
    notes: document.querySelector('#entry-notes').value.trim(),
  };

  const { error } = await client.from('research_entries').insert(payload);
  if (error) {
    setMessage(error.message, true);
    saveButton.disabled = false;
    return;
  }

  form.reset();
  setMessage('Research entry saved.');
  saveButton.disabled = false;
  await loadEntries();
}

async function initSupabase() {
  if (!supabaseUrl || !supabasePublishableKey) {
    setState('Supabase not configured', 'off');
    setControlsEnabled(false);
    return;
  }

  if (!globalThis.supabase?.createClient) {
    setState('Supabase client unavailable', 'error');
    setControlsEnabled(false);
    entriesRoot.innerHTML = '<p class="empty-state">The pinned Supabase client could not be loaded. Check network/CSP availability for cdn.jsdelivr.net.</p>';
    return;
  }

  client = globalThis.supabase.createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  try {
    setState('Creating anonymous workspace…', 'loading');
    await ensureAnonymousSession();
    setState('Supabase connected', 'ready');
    setControlsEnabled(true);
    await loadEntries();
  } catch (error) {
    setState('Supabase setup required', 'error');
    setControlsEnabled(false);
    entriesRoot.innerHTML = '<p class="empty-state">Supabase could not initialize. Apply the migration, enable anonymous sign-ins, and verify the public build variables.</p>';
    setMessage(error instanceof Error ? error.message : 'Supabase initialization failed.', true);
  }
}

form.addEventListener('submit', saveEntry);
refreshButton.addEventListener('click', async () => {
  setMessage('Refreshing…');
  try {
    await loadEntries();
    setMessage('Research entries refreshed.');
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Refresh failed.', true);
  }
});

initSupabase();
