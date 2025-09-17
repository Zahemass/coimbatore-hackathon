// ai.js
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

window.aiSuggestions = aiSuggestions;
