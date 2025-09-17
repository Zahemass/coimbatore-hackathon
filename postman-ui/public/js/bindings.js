// bindings.js
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

function initBindings() {
  $('sendBtn')?.addEventListener('click', sendRequest);
  $('formatBtn')?.addEventListener('click', formatBodyJSON);
  $('clearBtn')?.addEventListener('click', ()=> { $('bodyInput').value=''; });
  $('copyBtn')?.addEventListener('click', copyResponse);
  $('prettyBtn')?.addEventListener('click', prettyResponse);
  $('saveBtn')?.addEventListener('click', async ()=> { /* same save result */ });
  $('historySaveBtn')?.addEventListener('click', ()=> { addToHistory({ t: Date.now(), method: $('methodSelect').value, url: $('url').value, headers: $('headersInput').value, body: $('bodyInput').value }); });
  $('aiFillBtn')?.addEventListener('click', aiSuggestions);
  $('saveCodeBtn')?.addEventListener('click', saveEditedCode);
  $('rollbackBtn')?.addEventListener('click', rollbackCode);
  $('expandSnippet')?.addEventListener('click', openFullscreenEditor);
  $('closeEditor')?.addEventListener('click', closeFullscreenEditor);
  $('fullscreenSaveBtn')?.addEventListener('click', saveEditedCode);
  $('fullscreenRollbackBtn')?.addEventListener('click', rollbackCode);
  $('refreshRoutesBtn')?.addEventListener('click', loadApiList);

  initBootstrapTabs();
}
initBindings();

window.initBindings = initBindings;
