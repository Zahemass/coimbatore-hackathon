// main.js - bootstrap
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadPrefill();
    renderHistory();
    renderTimeline();
    await loadApiList();
    if (currentCodeFile) await loadCodeSnippet(currentCodeFile, '');
    initBootstrapTabs();
    activateBodyTabIfNeeded();
  } catch (err) {
    console.error("Init error:", err);
  }
});
