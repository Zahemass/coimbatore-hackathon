// postman-ui/client/src/components/SnippetPanel.jsx
import React, { useEffect, useRef } from "react";
import monaco from "../monacoSetup";
import axios from "axios";

export default function SnippetPanel({
  snippetCode,
  setSnippetCode,
  snippetFile,
  onExpand,
}) {
  const editorRef = useRef(null);
  const monacoInstance = useRef(null);

  // Initialize Monaco editor
  useEffect(() => {
    if (!editorRef.current) return;

    monacoInstance.current = monaco.editor.create(editorRef.current, {
      value: snippetCode || "// Select a route to load code...",
      language: "javascript",
      theme: "vs-dark",
      automaticLayout: true,
      fontFamily: "Montserrat",
      fontSize: 14,
    });

    // Update parent state on editor change
    monacoInstance.current.onDidChangeModelContent(() => {
      const newValue = monacoInstance.current.getValue();
      setSnippetCode(newValue);
    });

    return () => {
      if (monacoInstance.current) monacoInstance.current.dispose();
    };
  }, []);

  // Keep editor synced if snippetCode changes externally
  useEffect(() => {
    if (
      monacoInstance.current &&
      snippetCode !== undefined &&
      monacoInstance.current.getValue() !== snippetCode
    ) {
      monacoInstance.current.setValue(snippetCode);
    }
  }, [snippetCode]);

  // Save code to backend
  async function saveCode() {
    if (!snippetFile) return alert("⚠️ No file loaded yet!");
    try {
      const code = monacoInstance.current.getValue();
      const res = await axios.post("/save-code", {
        file: snippetFile,
        code,
      });
      alert("✅ Saved: " + (res.data?.savedTo || "unknown file"));
    } catch (err) {
      alert("❌ Save failed: " + err.message);
    }
  }

  // Rollback code from cache
  async function rollbackCode() {
    if (!snippetFile) return alert("⚠️ No file loaded yet!");
    try {
      const res = await axios.post("/rollback-code", { file: snippetFile });
      alert("↩️ Rolled back " + res.data?.rolledBack);
    } catch (err) {
      alert("❌ Rollback failed: " + err.message);
    }
  }

  return (
    <aside className="snippet-side card-style">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h6 className="m-0">API Code Snippet</h6>
        <div className="d-flex gap-2">
          <button onClick={saveCode} className="btn btn-sm btn-outline-light" title="Save">
            <i className="bi bi-save"></i>
          </button>
          <button onClick={rollbackCode} className="btn btn-sm btn-outline-light" title="Rollback">
            <i className="bi bi-arrow-counterclockwise"></i>
          </button>
          <button onClick={onExpand} className="btn btn-sm btn-outline-light" title="Fullscreen">
            <i className="bi bi-arrows-fullscreen"></i>
          </button>
        </div>
      </div>
      <div ref={editorRef} className="monaco-container"></div>
    </aside>
  );
}
