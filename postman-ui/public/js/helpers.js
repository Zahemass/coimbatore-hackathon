// helpers.js - global helpers & state
const $ = id => document.getElementById(id);
const historyKey = 'apitester_history_v2';
let timelineEntries = [];
let monacoEditor = null;
let monacoFullscreenEditor = null;
let currentCodeFile = null;

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
function flashError(msg) { const el = mkNode('div','tiny muted-note', msg); el.style.color = 'var(--danger)'; document.body.appendChild(el); setTimeout(()=> el.remove(), 2400); }
function animateButton(btn) { try { if (!btn) return; btn.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }, { transform: 'translateY(0)' }], { duration: 260 }); } catch {} }
function getSummary(obj) { if (!obj) return ''; if (obj.message) return obj.message; if (obj.error) return obj.error; return ''; }

window.$ = $;
window.mkNode = mkNode;
window.verbColor = verbColor;
window.truncate = truncate;
window.pulseEl = pulseEl;
window.showToast = showToast;
window.flashError = flashError;
window.animateButton = animateButton;
window.getSummary = getSummary;
window.historyKey = historyKey;
window.timelineEntries = timelineEntries;
window.monacoEditor = monacoEditor;
window.monacoFullscreenEditor = monacoFullscreenEditor;
window.currentCodeFile = currentCodeFile;
