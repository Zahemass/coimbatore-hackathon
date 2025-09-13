// app.js - cleaned and fixed (tabs scoping + response activation + monaco init)

// Basic helpers & state
const $ = id => document.getElementById(id);
const historyKey = 'apitester_history_v2';
let timelineEntries = [];
let monacoEditor = null;
let monacoFullscreenEditor = null;
let currentCodeFile = null;

// small helpers
function mkNode(tag, cls, inner) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (inner !== undefined) e.innerHTML = inner;
  return e;
}
function verbColor(v) {
  if (v === 'GET') return '#9ecbff';
  if (v === 'POST') return '#60a5fa';
  if (v === 'PUT') return '#fbbf24';
  if (v === 'DELETE') return '#fb7185';
  return '#999';
}
function truncate(s, n=40) { return s && s.length>n ? s.slice(0,n-1)+'…' : (s||''); }
function pulseEl(el) { if(!el) return; el.style.boxShadow='0 6px 20px rgba(80,160,255,0.06)'; setTimeout(()=>el.style.boxShadow='',350); }
function showToast(text) { const t = mkNode('div','tiny muted-note', text); t.style.position='fixed'; t.style.right='18px'; t.style.bottom='18px'; t.style.background='rgba(0,0,0,0.6)'; t.style.padding='8px 12px'; t.style.borderRadius='8px'; document.body.appendChild(t); setTimeout(()=>t.remove(),1800); }

// -------------- prefill / body injection --------------
async function loadPrefill() {
  try { if ($('url') && !$('url').value) $('url').value = ''; } catch (e){}

  const urlSearch = new URLSearchParams(window.location.search);
  const qpMethod = (urlSearch.get('method') || '').toLowerCase();
  const qpBase = (urlSearch.get('base') || '').trim();
  const qpEndpoint = (urlSearch.get('endpoint') || '').trim();

  let pref = null;
  try {
    const res = await fetch('/gui-prefill.json', { cache: 'no-store' });
    if (res.ok) pref = await res.json();
  } catch (e) { /* ignore */ }

  const effectiveMethod = qpMethod || (pref && pref.methods && pref.methods[0]) || 'post';
  const effectiveBase = qpBase || (pref && pref.baseUrl) || null;
  const effectiveEndpoint = qpEndpoint || (pref && pref.endpoint) || '';

  // method
  const ms = $('methodSelect');
  if (ms) {
    const normalized = (effectiveMethod||'post').toUpperCase();
    const found = Array.from(ms.options).some(o => o.value.toUpperCase() === normalized);
    ms.value = found ? normalized : ms.options[0].value;
  }

  // base injection
  if (effectiveBase && $('baseSelect')) {
    const exists = Array.from($('baseSelect').options).some(o => o.value === effectiveBase);
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = effectiveBase;
      opt.textContent = effectiveBase.replace(/^https?:\/\//,'');
      $('baseSelect').insertBefore(opt, $('baseSelect').firstChild);
    }
    $('baseSelect').value = effectiveBase;
  }

  // build url
  try {
    const baseForUrl = effectiveBase || ($('baseSelect') ? $('baseSelect').value : '');
    const endpointPart = effectiveEndpoint || '/';
    if ($('url')) {
      if (pref && pref.url) {
        $('url').value = pref.url;
      } else if (baseForUrl) {
        $('url').value = baseForUrl.replace(/\/+$/,'') + '/' + endpointPart.replace(/^\/+/,'' );
      } else if (endpointPart) {
        $('url').value = endpointPart;
      }
    }
  } catch (e) { console.warn('failed to build prefill url', e); }

  if (pref && pref.file) {
    currentCodeFile = pref.file;
    console.info('prefill: currentCodeFile =', currentCodeFile);
  }

  if (pref && pref.body) {
    try {
      if ($('bodyInput')) $('bodyInput').value = pref.body;
      safeInjectAuthHeaderFromBody();
      activateBodyTabIfNeeded();
    } catch (e) { console.warn('failed to apply pref body', e); }
    return;
  }

  try {
    const t = await fetch('/testdata.json', { cache: 'no-store' });
    if (t.ok) {
      const td = await t.json();
      if (td && td[effectiveEndpoint] && td[effectiveEndpoint][0]) {
        if ($('bodyInput')) $('bodyInput').value = JSON.stringify(td[effectiveEndpoint][0].data, null, 2);
        safeInjectAuthHeaderFromBody();
        activateBodyTabIfNeeded();
        return;
      }
    }
  } catch (e) { /* ignore */ }

  if (['post','put'].includes(effectiveMethod)) {
    try {
      const gen = await fetch('/generate-testcases', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ endpoint: effectiveEndpoint || '/', numCases: 5 })
      });
      if (gen.ok) {
        const json = await gen.json();
        const cases = json.cases || json || [];
        if (cases.length) {
          if ($('bodyInput')) $('bodyInput').value = JSON.stringify(cases[0].data, null, 2);
          safeInjectAuthHeaderFromBody();
          activateBodyTabIfNeeded();
          return;
        }
      }
    } catch (e) { console.warn('generate-testcases failed', e); }
  }

  if ($('bodyInput') && !$('bodyInput').value) $('bodyInput').value = JSON.stringify({ hello: 'world' }, null, 2);
  safeInjectAuthHeaderFromBody();
}

function safeInjectAuthHeaderFromBody() {
  try {
    const bodyTxt = $('bodyInput') ? $('bodyInput').value || '' : '';
    if (!bodyTxt) return;
    let parsed = null;
    try { parsed = JSON.parse(bodyTxt); } catch { parsed = null; }
    if (parsed && parsed.token) {
      const hdrEl = $('headersInput');
      if (!hdrEl) return;
      const hasAuth = (hdrEl.value || '').split(/\r?\n/).some(l => /authorization\s*:/i.test(l));
      if (!hasAuth) {
        hdrEl.value = `Authorization: Bearer ${parsed.token}` + (hdrEl.value ? '\n' + hdrEl.value : '');
      }
    }
  } catch (e) { /* ignore */ }
}

function activateBodyTabIfNeeded() {
  try {
    const bodyHas = $('bodyInput') && $('bodyInput').value && $('bodyInput').value.trim().length > 0;
    const method = $('methodSelect') ? ($('methodSelect').value || 'POST').toUpperCase() : 'POST';
    if (bodyHas || ['POST','PUT'].includes(method)) {
      const btn = document.querySelector('[data-bs-target="#bodyTab"]');
      if (btn && window.bootstrap && window.bootstrap.Tab) {
        const t = window.bootstrap.Tab.getOrCreateInstance(btn);
        t.show();
      } else if (btn) {
        btn.click();
      }
      setTimeout(()=> { if ($('bodyInput')) { $('bodyInput').focus(); pulseEl($('bodyInput')); } }, 120);
    }
  } catch (e) { console.warn('activateBodyTabIfNeeded', e); }
}

// ---------------- History/Timeline ----------------
function loadHistory() { try { const raw = localStorage.getItem(historyKey); return raw ? JSON.parse(raw) : []; } catch { return []; } }
function saveHistory(arr) { localStorage.setItem(historyKey, JSON.stringify(arr.slice(0,50))); renderHistory(); }
function addToHistory(item) { const arr = loadHistory(); arr.unshift(item); saveHistory(arr); }
function renderHistory() {
  const container = $('history');
  if (!container) return;
  container.innerHTML = '';
  const arr = loadHistory();
  if (!arr.length) { container.innerHTML = '<div class="tiny muted-note">No saved history</div>'; return; }
  arr.forEach(it => {
    const row = mkNode('div','hist-item');
    row.innerHTML = `<div style="display:flex;gap:8px;align-items:center">
      <div class="badge-verb" style="background:${verbColor(it.method)}">${it.method}</div>
      <div style="font-weight:700">${truncate(it.url, 48)}</div>
    </div>
    <div class="tiny muted-note">${new Date(it.t).toLocaleString()}</div>`;
    row.onclick = () => {
      if ($('methodSelect')) $('methodSelect').value = it.method;
      if ($('url')) $('url').value = it.url;
      if ($('headersInput')) $('headersInput').value = it.headers || '';
      if ($('bodyInput')) $('bodyInput').value = it.body || '';
      activateBodyTabIfNeeded();
    };
    container.appendChild(row);
  });
}

function pushTimeline(entry) { timelineEntries.unshift(entry); renderTimeline(); }
function renderTimeline() {
  const t = $('timeline'); if (!t) return; t.innerHTML = '';
  if (!timelineEntries.length) { t.innerHTML = '<div class="tiny muted-note">No requests yet</div>'; return; }
  timelineEntries.slice(0,30).forEach(en => {
    const el = mkNode('div','hist-item enter');
    el.innerHTML = `<div style="display:flex;gap:10px;align-items:center">
      <div class="badge-verb" style="background:${verbColor(en.method)}">${en.method}</div>
      <div style="min-width:160px"><b>${truncate(en.url,40)}</b><div class="tiny muted-note">${en.summary || ''}</div></div>
    </div>
    <div class="tiny muted-note">${en.status} • ${en.took}ms</div>`;
    t.appendChild(el);
  });
}

// --------------- Response helpers (activate response tab) ---------------
function activateResponseTab() {
  try {
    const btn = document.querySelector('[data-bs-target="#respTab"]');
    if (!btn) return;
    if (window.bootstrap && window.bootstrap.Tab) {
      const t = window.bootstrap.Tab.getOrCreateInstance(btn);
      t.show();
    } else {
      btn.click();
    }
  } catch (e) { console.warn('activateResponseTab', e); }
}

function showResponse(status, data, ms, size, url, isError=false) {
  // keep request panel intact; activate the response tab only
  activateResponseTab();

  const statusEl = $('statusBadge');
  if (statusEl) {
    statusEl.textContent = status;
    statusEl.className = 'status-badge ' + (String(status).toString().startsWith('2') ? 'status-2xx' : (String(status).toString().startsWith('4') ? 'status-4xx' : '') );
  }
  if ($('metaTime')) $('metaTime').textContent = ms + ' ms';
  if ($('metaSize')) $('metaSize').textContent = (typeof size === 'number' ? size : (String(size))) + ' bytes';
  if ($('metaUrl')) $('metaUrl').textContent = truncate(url, 180);
  const pretty = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  if ($('responseBox')) $('responseBox').textContent = pretty;
}

// copy, pretty, format
async function copyResponse() {
  try {
    const txt = $('responseBox') ? $('responseBox').textContent : '';
    if (!txt) return flashError('No response to copy');
    await navigator.clipboard.writeText(txt);
    showToast('Copied to clipboard');
  } catch (e) { flashError('Copy failed'); }
}
function prettyResponse() {
  const el = $('responseBox');
  if (!el) return;
  try {
    const parsed = JSON.parse(el.textContent);
    el.textContent = JSON.stringify(parsed, null, 2);
    showToast('Response prettified');
  } catch (e) {
    flashError('Response not valid JSON');
  }
}
function formatBodyJSON() {
  const el = $('bodyInput');
  if (!el) return;
  try {
    const txt = el.value.trim();
    if (!txt) return;
    const obj = JSON.parse(txt);
    el.value = JSON.stringify(obj, null, 2);
    pulseEl(el);
  } catch (e) { flashError('Invalid JSON: ' + e.message); }
}

// AI suggestions (server generate)
async function aiSuggestions() {
  const panel = $('aiPanel'); if (!panel) return;
  panel.innerHTML = '<div class="tiny muted-note">AI thinking <span style="margin-left:6px"><i class="bi bi-robot"></i></span></div>';
  try {
    const url = $('url') ? $('url').value || '' : '';
    let endpoint = '/';
    try { const u = new URL(url); endpoint = u.pathname || '/'; } catch {
      const parts = url.split('/'); endpoint = '/' + (parts.slice(3).join('/') || '').replace(/\/+$/,'');
    }

    const resp = await fetch('/generate-testcases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint, numCases: 5 }) });
    if (!resp.ok) {
      const err = await resp.json().catch(()=>({ error: 'unknown' }));
      panel.innerHTML = `<div class="tiny muted-note" style="color:var(--danger)">AI generation failed: ${err.error || resp.status}</div>`; return;
    }
    const json = await resp.json();
    const cases = json.cases || [];
    if (cases.length === 0) { panel.innerHTML = '<div class="tiny muted-note">No suggestions returned</div>'; return; }

    panel.innerHTML = '';
    cases.forEach((c, i) => {
      const node = mkNode('div','ai-suggestion');
      node.innerHTML = `<div style="max-width:70%"><b>${c.name || ('case ' + (i+1))}</b><div class="meta">${truncate(JSON.stringify(c.data), 160)}</div></div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm btn-outline-light ai-fill" data-i="${i}"><i class="bi bi-play-fill"></i> Fill</button>
          <button class="btn btn-sm btn-outline-light ai-copy" data-copy="${i}"><i class="bi bi-clipboard"></i></button>
        </div>`;
      panel.appendChild(node);
    });

    panel.querySelectorAll('.ai-fill').forEach(b => {
      b.onclick = () => {
        const idx = +b.getAttribute('data-i'); if (!cases[idx]) return;
        if ($('bodyInput')) $('bodyInput').value = JSON.stringify(cases[idx].data, null, 2);
        safeInjectAuthHeaderFromBody(); pulseEl($('bodyInput')); activateBodyTabIfNeeded();
      };
    });
    panel.querySelectorAll('.ai-copy').forEach(b => {
      b.onclick = () => {
        const idx = +b.getAttribute('data-copy'); navigator.clipboard.writeText(JSON.stringify(cases[idx].data, null, 2)); showToast('Copied suggestion');
      };
    });
  } catch (err) { console.error('AI suggestions error', err); panel.innerHTML = `<div class="tiny muted-note" style="color:var(--danger)">AI error: ${err.message}</div>`; }
}

// ---------------- Monaco & routes ----------------
function safeGet(id) { return document.getElementById(id); }

// Require / Monaco (paths) - use the globally loaded loader
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
require(['vs/editor/editor.main'], function () {
  const cont = safeGet('monacoContainer');
  const full = safeGet('monacoFullscreen');
  if (cont) {
    monacoEditor = monaco.editor.create(cont, {
      value: '// Select a route to load code...',
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      fontFamily: 'Montserrat'
    });
  }
  if (full) {
    monacoFullscreenEditor = monaco.editor.create(full, {
      value: '// Fullscreen editor',
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      fontFamily: 'Montserrat'
    });
  }

  (async function initAfterMonaco(){
    try {
      await loadPrefill();
      renderHistory();
      renderTimeline();
      await loadApiList();
      if (currentCodeFile) {
        try { await loadCodeSnippet(currentCodeFile, ''); } catch (e) {}
      }
      initBootstrapTabs();
      activateBodyTabIfNeeded();
    } catch (e) { console.warn('initAfterMonaco error', e); }
  })();
});

// load API list
async function loadApiList() {
  const list = safeGet('apiList'); if (!list) return;
  list.innerHTML = '<div class="tiny muted-note">Loading routes…</div>';
  try {
    const res = await fetch('/routes', { cache: 'no-store' });
    if (!res.ok) { list.innerHTML = `<div class="tiny muted-note" style="color:var(--danger)">Failed to load routes (${res.status})</div>`; return; }
    const apis = await res.json();
    list.innerHTML = '';
    if (!apis.length) { list.innerHTML = "<div class='tiny text-muted'>No APIs found</div>"; return; }
    apis.forEach(api => {
      const row = mkNode('div','hist-item');
      const fname = api.file ? api.file.split(/[\\/]/).pop() : '';
      row.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center">
          <div class="badge-verb" style="background:${verbColor(api.method.toUpperCase())}">${api.method.toUpperCase()}</div>
          <div style="font-weight:700">${api.path}</div>
        </div>
        <div class="tiny text-muted">${fname}</div>
      `;
      row.onclick = () => loadCodeSnippet(api.file, api.path);
      list.appendChild(row);
    });
  } catch (err) { console.error('loadApiList err', err); list.innerHTML = '<div class="tiny muted-note">Failed to load routes</div>'; }
}

// load code snippet
async function loadCodeSnippet(file, endpoint) {
  if (!file) return;
  try {
    const res = await fetch(`/code?file=${encodeURIComponent(file)}&endpoint=${encodeURIComponent(endpoint||'')}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('fetch code failed');
    const code = await res.text();
    currentCodeFile = file;
    if (monacoEditor) {
      monacoEditor.setValue(code);
      monacoEditor.setScrollTop(0);
      const cont = safeGet('monacoContainer');
      if (cont) {
        if (code.length > 1200) cont.classList.add('long-snippet-bg'); else cont.classList.remove('long-snippet-bg');
      }
    }
    if (monacoFullscreenEditor) monacoFullscreenEditor.setValue(code);
    if ($('codeStatus')) $('codeStatus').innerText = `✅ Loaded ${endpoint || file} from ${file}`;
    if ($('fullscreenFileLabel')) $('fullscreenFileLabel').innerText = file.split(/[\\/]/).pop();
  } catch (err) {
    if (monacoEditor) monacoEditor.setValue('// Failed to load code: ' + (err.message||''));
    if ($('codeStatus')) $('codeStatus').innerText = '❌ Failed to load code';
  }
}

// save code / rollback
async function saveEditedCode() {
  const file = currentCodeFile; if (!file) return flashError('No file selected');
  const code = monacoEditor ? monacoEditor.getValue() : '';
  try {
    const res = await fetch('/save-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file, code }) });
    const j = await res.json();
    if (j.ok) { showToast('Saved to ' + file.split(/[\\/]/).pop()); if ($('codeStatus')) $('codeStatus').innerText = `✅ Saved to ${file}`; }
    else { flashError('Save failed: ' + (j.error || 'unknown')); if ($('codeStatus')) $('codeStatus').innerText = '❌ Save failed'; }
  } catch (err) { flashError('Save failed'); if ($('codeStatus')) $('codeStatus').innerText = '❌ Save failed'; }
}
async function rollbackCode() {
  const file = currentCodeFile; if (!file) return flashError('No file selected');
  try {
    const res = await fetch('/rollback-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file }) });
    const j = await res.json();
    if (j.ok) { showToast('Rolled back ' + file.split(/[\\/]/).pop()); loadCodeSnippet(file, ''); if ($('codeStatus')) $('codeStatus').innerText = `🔙 Rolled back ${file}`; }
    else { flashError('Rollback failed: ' + (j.error || 'unknown')); if ($('codeStatus')) $('codeStatus').innerText = '❌ Rollback failed'; }
  } catch (err) { flashError('Rollback failed'); if ($('codeStatus')) $('codeStatus').innerText = '❌ Rollback failed'; }
}

// fullscreen
function openFullscreenEditor() { const fs = $('fullscreenEditor'); if (!fs || !monacoEditor || !monacoFullscreenEditor) return; fs.style.display = 'block'; monacoFullscreenEditor.setValue(monacoEditor.getValue()); setTimeout(()=> monacoFullscreenEditor.layout(), 60); }
function closeFullscreenEditor() { const fs = $('fullscreenEditor'); if (!fs || !monacoEditor || !monacoFullscreenEditor) return; fs.style.display = 'none'; monacoEditor.setValue(monacoFullscreenEditor.getValue()); }

// -------------- Tab wiring (SCOPE the toggle to the correct content) --------------
function initBootstrapTabs() {
  try {
    const tabButtons = Array.from(document.querySelectorAll('[data-bs-toggle="tab"], .nav-tabs .nav-link'));
    tabButtons.forEach(btn => {
      // remove existing handlers to avoid duplicates
      btn.onclick = null;
      btn.addEventListener('click', (ev) => {
        try {
          const TabCtor = window.bootstrap && window.bootstrap.Tab;
          if (TabCtor) {
            const tab = TabCtor.getOrCreateInstance(btn);
            tab.show();
          } else {
            // fallback manual toggle but scoped to this tab group only
            const target = btn.dataset.bsTarget || btn.getAttribute('data-bs-target');
            if (target) {
              const nav = btn.closest('.nav');
              const content = nav ? nav.nextElementSibling : document;
              if (nav) nav.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active'));
              btn.classList.add('active');
              if (content) content.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('show','active'));
              const pane = document.querySelector(target);
              if (pane) pane.classList.add('show','active');
            }
          }
        } catch (e) { console.warn('tab show failed', e); }
      });
    });
  } catch (e) { console.warn('initBootstrapTabs failed', e); }
}

// --------------- bindings ----------------
function initBindings() {
  if ($('sendBtn')) $('sendBtn').addEventListener('click', sendRequest);
  if ($('formatBtn')) $('formatBtn').addEventListener('click', formatBodyJSON);
  if ($('clearBtn')) $('clearBtn').addEventListener('click', ()=> { if($('bodyInput')) $('bodyInput').value=''; });
  if ($('copyBtn')) $('copyBtn').addEventListener('click', copyResponse);
  if ($('prettyBtn')) $('prettyBtn').addEventListener('click', prettyResponse);
  if ($('saveBtn')) $('saveBtn').addEventListener('click', async ()=> {
    const respText = $('responseBox') ? $('responseBox').textContent : null;
    if (!respText) return flashError('No response to save');
    try {
      const parsed = JSON.parse(respText || '{}');
      await fetch('/save-result', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) });
      showToast('Saved to server');
    } catch (e) { flashError('Save failed'); }
  });
  if ($('historySaveBtn')) $('historySaveBtn').addEventListener('click', ()=> {
    addToHistory({ t: Date.now(), method: $('methodSelect') ? $('methodSelect').value : 'POST', url: $('url') ? $('url').value : '', headers: $('headersInput') ? $('headersInput').value : '', body: $('bodyInput') ? $('bodyInput').value : '' });
    showToast('Saved to local history');
  });
  if ($('aiFillBtn')) $('aiFillBtn').addEventListener('click', aiSuggestions);
  if ($('saveCodeBtn')) $('saveCodeBtn').addEventListener('click', saveEditedCode);
  if ($('rollbackBtn')) $('rollbackBtn').addEventListener('click', rollbackCode);
  if ($('expandSnippet')) $('expandSnippet').addEventListener('click', openFullscreenEditor);
  if ($('closeEditor')) $('closeEditor').addEventListener('click', closeFullscreenEditor);
  if ($('fullscreenSaveBtn')) $('fullscreenSaveBtn').addEventListener('click', saveEditedCode);
  if ($('fullscreenRollbackBtn')) $('fullscreenRollbackBtn').addEventListener('click', rollbackCode);
  if ($('refreshRoutesBtn')) $('refreshRoutesBtn').addEventListener('click', loadApiList);

  if ($('bodyInput')) {
    $('bodyInput').addEventListener('input', () => {
      clearTimeout(window._bodyInjectDeb);
      window._bodyInjectDeb = setTimeout(() => {
        const hdrEl = $('headersInput');
        const hasAuth = hdrEl && (hdrEl.value || '').split(/\r?\n/).some(l => /authorization\s*:/i.test(l));
        if (!hasAuth) safeInjectAuthHeaderFromBody();
      }, 250);
    });
  }

  // keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) return;
    if (e.key.toLowerCase() === 's') { e.preventDefault(); if ($('sendBtn')) $('sendBtn').click(); }
    if (e.key.toLowerCase() === 'h') { e.preventDefault(); if ($('historySaveBtn')) $('historySaveBtn').click(); }
  });

  initBootstrapTabs();
}
initBindings();

// fallback init if monaco isn't done yet
(async function tryInit(){
  try {
    await loadPrefill();
    renderHistory();
    renderTimeline();
    await loadApiList();
    activateBodyTabIfNeeded();
  } catch(e){ /* ignore */ }
})();

// ------------------- sendRequest (single, final) -------------------
async function sendRequest() {
  const sendBtn = $('sendBtn');
  const spinner = $('spinnerDots');
  if (sendBtn) sendBtn.disabled = true;
  if (spinner) spinner.classList.add('active');

  let method = 'POST';
  if ($('methodSelect')) method = ($('methodSelect').value || 'POST').toUpperCase();

  let url = $('url') ? $('url').value.trim() : '';
  if (!url) { flashError('Enter URL'); if (sendBtn) sendBtn.disabled=false; if (spinner) spinner.classList.remove('active'); return; }

  // headers parsing
  let headers = {};
  const hdrText = $('headersInput') ? $('headersInput').value.trim() : '';
  if (hdrText) {
    hdrText.split(/\r?\n/).forEach(l=>{
      const idx = l.indexOf(':');
      if (idx>-1) headers[l.slice(0,idx).trim()] = l.slice(idx+1).trim();
    });
  } else {
    headers['Content-Type'] = 'application/json';
  }

  // auth override
  const authText = $('authInput') ? $('authInput').value.trim() : '';
  if (authText) headers['Authorization'] = authText.replace(/authorization:\s*/i, '').trim();

  // params
  const params = $('paramsInput') ? $('paramsInput').value.trim() : '';
  if (params) url += (url.includes('?') ? '&' : '?') + params;

  // body parse
  let data = undefined;
  if (method !== 'GET') {
    try { data = $('bodyInput') ? JSON.parse($('bodyInput').value || '{}') : {}; } catch (e) { flashError('Body JSON invalid'); if (sendBtn) sendBtn.disabled=false; if (spinner) spinner.classList.remove('active'); return; }
  }

  const t0 = performance.now();
  try {
    // try direct browser request (fast if CORS allowed)
    const res = await axios({ method, url, headers, data, timeout: 20000 });
    const took = Math.round(performance.now() - t0);
    showResponse(res.status, res.data, took, JSON.stringify(res.data || '').length, url);
    pushTimeline({ method, url, status: res.status, took, summary: getSummary(res.data) });
    addToHistory({ t: Date.now(), method, url, headers: hdrText, body: $('bodyInput') ? $('bodyInput').value : '' });
  } catch (err) {
    const took = Math.round(performance.now() - t0);
    console.warn("Direct request failed:", err);

    // 4xx/5xx - axios included response
    if (err && err.response) {
      showResponse(err.response.status, err.response.data, took, JSON.stringify(err.response.data || '').length, url, true);
      pushTimeline({ method, url, status: err.response.status, took, summary: getSummary(err.response.data) });
      addToHistory({ t: Date.now(), method, url, headers: hdrText, body: $('bodyInput') ? $('bodyInput').value : '' });
      if (sendBtn) sendBtn.disabled = false;
      if (spinner) spinner.classList.remove('active');
      animateButton(sendBtn);
      return;
    }

    // fallback: server proxy to avoid CORS
    try {
      console.info("Falling back to server /proxy");
      const proxyResp = await fetch('/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, method, headers, body: data })
      });

      const j = await proxyResp.json().catch(()=>({ error: 'invalid proxy json' }));
      const proxyTook = Math.round(performance.now() - t0);

      if (proxyResp.ok && j && j.proxied) {
        showResponse(j.status || 'PROXY', j.data || j, proxyTook, JSON.stringify(j.data || '').length, url, j.status >= 400);
        pushTimeline({ method, url, status: j.status || 'PROXY', took: proxyTook, summary: (j.data && (j.data.message || j.data.error)) || '' });
        addToHistory({ t: Date.now(), method, url, headers: hdrText, body: $('bodyInput') ? $('bodyInput').value : '' });
      } else {
        const detail = j && (j.error || JSON.stringify(j)) || 'No details';
        showResponse('ERR', { error: 'Proxy failed', detail }, proxyTook, 0, url, true);
        console.error('Proxy failed:', j);
      }
    } catch (proxyErr) {
      const proxyTook = Math.round(performance.now() - t0);
      console.error("Proxy request failed:", proxyErr);
      showResponse('ERR', { error: 'Proxy failed', detail: proxyErr.message || proxyErr }, proxyTook, 0, url, true);
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      if (spinner) spinner.classList.remove('active');
      animateButton(sendBtn);
    }
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    if (spinner) spinner.classList.remove('active');
  }
}

// small extras
function flashError(msg) {
  const el = mkNode('div','tiny muted-note', msg);
  el.style.color = 'var(--danger)';
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 2400);
}
function animateButton(btn) {
  try { if (!btn) return; btn.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }, { transform: 'translateY(0)' }], { duration: 260 }); } catch {}
}
function getSummary(obj) {
  if (!obj) return '';
  if (obj.message) return obj.message;
  if (obj.error) return obj.error;
  return '';
}

