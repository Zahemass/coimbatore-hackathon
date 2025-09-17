// prefill.js
async function loadPrefill() {
  try { if ($('url') && !$('url').value) $('url').value = ''; } catch {}

  let pref = null;
  try {
    const res = await fetch('/gui-prefill.json', { cache: 'no-store' });
    if (res.ok) pref = await res.json();
  } catch {}

  const urlSearch = new URLSearchParams(window.location.search);
  const qpMethod = (urlSearch.get('method') || '').toLowerCase();
  const qpBase = (urlSearch.get('base') || '').trim();
  const qpEndpoint = (urlSearch.get('endpoint') || '').trim();

  const effectiveMethod = qpMethod || (pref?.methods?.[0]) || 'post';
  const effectiveBase = qpBase || (pref?.baseUrl) || null;
  const effectiveEndpoint = qpEndpoint || (pref?.endpoint) || '';

  // method select
  if ($('methodSelect')) {
    const normalized = effectiveMethod.toUpperCase();
    $('methodSelect').value = normalized;
  }

  // base select
  if (effectiveBase && $('baseSelect')) {
    if (![...$('baseSelect').options].some(o => o.value === effectiveBase)) {
      const opt = document.createElement('option');
      opt.value = effectiveBase;
      opt.textContent = effectiveBase.replace(/^https?:\/\//,'');
      $('baseSelect').insertBefore(opt, $('baseSelect').firstChild);
    }
    $('baseSelect').value = effectiveBase;
  }

  // url field
  if ($('url')) {
    $('url').value = pref?.url || (effectiveBase ? effectiveBase.replace(/\/+$/,'') + '/' + effectiveEndpoint.replace(/^\/+/,'' ) : effectiveEndpoint);
  }

  if (pref?.file) currentCodeFile = pref.file;

  // headers prefill
  if (pref?.headers && $('headersInput')) {
    $('headersInput').value = Object.entries(pref.headers).map(([k,v]) => `${k}: ${v}`).join('\n');
  }
  if (pref?.headers?.Authorization && $('authInput')) {
    $('authInput').value = pref.headers.Authorization;
  }

  // body prefill
  if (pref?.body && $('bodyInput')) $('bodyInput').value = pref.body;

  safeInjectAuthHeaderFromBody();
  activateBodyTabIfNeeded();
}

function safeInjectAuthHeaderFromBody() { /* same as your version */ }
function activateBodyTabIfNeeded() { /* same as your version */ }

window.loadPrefill = loadPrefill;
window.safeInjectAuthHeaderFromBody = safeInjectAuthHeaderFromBody;
window.activateBodyTabIfNeeded = activateBodyTabIfNeeded;
