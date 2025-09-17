// app.js - entry
async function sendRequest() {
  const method = ($('methodSelect') ? $('methodSelect').value : 'POST').toUpperCase();
  let url = $('url').value.trim();
  let headers = {};
  const hdrText = $('headersInput').value.trim();
  if (hdrText) hdrText.split(/\r?\n/).forEach(l => { const idx = l.indexOf(':'); if (idx>-1) headers[l.slice(0,idx).trim()] = l.slice(idx+1).trim(); });
  const authText = $('authInput').value.trim();
  if (authText) headers['Authorization'] = authText.replace(/authorization:\s*/i, '').trim();
  let data = {};
  if (method !== 'GET') try { data = JSON.parse($('bodyInput').value || '{}'); } catch { flashError('Body JSON invalid'); return; }
  const t0 = performance.now();
  try {
    const res = await axios({ method, url, headers, data });
    const took = Math.round(performance.now() - t0);
    showResponse(res.status, res.data, took, JSON.stringify(res.data).length, url);
    addToHistory({ t: Date.now(), method, url, headers: hdrText, body: $('bodyInput').value });
  } catch (err) {
    showResponse(err.response?.status || 'ERR', err.response?.data || { error: err.message }, 0, 0, url);
  }
}
