// monaco.js
function safeGet(id) { return document.getElementById(id); }

require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
require(['vs/editor/editor.main'], function () {
  const cont = safeGet('monacoContainer');
  if (cont) monacoEditor = monaco.editor.create(cont, { value: '// Select a route', language: 'javascript', theme: 'vs-dark', automaticLayout: true, fontFamily: 'Montserrat' });
  const full = safeGet('monacoFullscreen');
  if (full) monacoFullscreenEditor = monaco.editor.create(full, { value: '// Fullscreen editor', language: 'javascript', theme: 'vs-dark', automaticLayout: true, fontFamily: 'Montserrat' });
});

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


window.loadApiList = loadApiList;
window.loadCodeSnippet = loadCodeSnippet;
window.saveEditedCode = saveEditedCode;
window.rollbackCode = rollbackCode;
window.openFullscreenEditor = openFullscreenEditor;
window.closeFullscreenEditor = closeFullscreenEditor;
