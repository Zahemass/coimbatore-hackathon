// history.js
function loadHistory() { try { return JSON.parse(localStorage.getItem(historyKey)) || []; } catch { return []; } }
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

window.loadHistory = loadHistory;
window.saveHistory = saveHistory;
window.addToHistory = addToHistory;
window.renderHistory = renderHistory;
window.pushTimeline = pushTimeline;
window.renderTimeline = renderTimeline;
