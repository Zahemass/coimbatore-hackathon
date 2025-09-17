// response.js
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

window.activateResponseTab = activateResponseTab;
window.showResponse = showResponse;
window.copyResponse = copyResponse;
window.prettyResponse = prettyResponse;
window.formatBodyJSON = formatBodyJSON;
