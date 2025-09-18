// postman-ui/client/src/components/FullscreenEditor.jsx
import React, { useEffect, useRef } from "react";
import monaco from "../monacoSetup";
import axios from "axios";

export default function FullscreenEditor({
  open,
  setOpen,
  snippetCode,
  setSnippetCode,
  snippetFile,
}) {
  const editorRef = useRef(null);
  const monacoInstance = useRef(null);

  // Initialize Monaco when fullscreen is open
  useEffect(() => {
    if (open && editorRef.current) {
      monacoInstance.current = monaco.editor.create(editorRef.current, {
        value: snippetCode || "// Fullscreen editor",
        language: "javascript",
        theme: "vs-dark",
        automaticLayout: true,
        fontFamily: "Montserrat",
        fontSize: 14,
      });

      monacoInstance.current.onDidChangeModelContent(() => {
        const newValue = monacoInstance.current.getValue();
        setSnippetCode(newValue);
      });
    }

    return () => {
      if (monacoInstance.current) {
        monacoInstance.current.dispose();
        monacoInstance.current = null;
      }
    };
  }, [open]);

  // Sync when snippetCode changes externally
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
      const res = await axios.post("/save-code", { file: snippetFile, code });
      alert("✅ Saved: " + (res.data?.savedTo || "unknown file"));
    } catch (err) {
      alert("❌ Save failed: " + err.message);
    }
  }

  // Rollback code
  async function rollbackCode() {
    if (!snippetFile) return alert("⚠️ No file loaded yet!");
    try {
      const res = await axios.post("/rollback-code", { file: snippetFile });
      alert("↩️ Rolled back " + res.data?.rolledBack);
    } catch (err) {
      alert("❌ Rollback failed: " + err.message);
    }
  }

  if (!open) return null;

  return (
    <div className="fullscreen-editor">
      <div className="editor-header">
        <div className="d-flex gap-2 w-100">
          <button
            onClick={() => setOpen(false)}
            className="btn btn-sm btn-outline-light"
          >
            <i className="bi bi-x-lg"></i>
          </button>
          <div className="ms-auto d-flex gap-2">
            <button onClick={saveCode} className="btn btn-sm btn-outline-light">
              <i className="bi bi-save"></i> Save
            </button>
            <button onClick={rollbackCode} className="btn btn-sm btn-outline-light">
              <i className="bi bi-arrow-counterclockwise"></i> Rollback
            </button>
          </div>
        </div>
      </div>
      <div ref={editorRef} className="monaco-container fullscreen-monaco"></div>
    </div>
  );
}
