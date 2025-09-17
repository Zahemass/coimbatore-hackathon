import React, { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import axios from "axios";

export default function SnippetPanel({
  snippetCode,
  setSnippetCode,
  snippetFile,
  onExpand,
}) {
  const editorRef = useRef(null);
  const monacoInstance = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;
    monacoInstance.current = monaco.editor.create(editorRef.current, {
      value: snippetCode || "// Select a route to load code...",
      language: "javascript",
      theme: "vs-dark",
      automaticLayout: true,
      fontFamily: "Montserrat",
    });

    return () => {
      if (monacoInstance.current) monacoInstance.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (monacoInstance.current && snippetCode !== undefined) {
      monacoInstance.current.setValue(snippetCode);
    }
  }, [snippetCode]);

  async function saveCode() {
    if (!snippetFile) return alert("No file loaded yet!");
    try {
      const code = monacoInstance.current.getValue();
      const res = await axios.post("/save-code", {
        file: snippetFile,
        code,
      });
      alert("Saved: " + (res.data?.savedTo || "unknown file"));
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  }

  async function rollbackCode() {
    if (!snippetFile) return alert("No file loaded yet!");
    try {
      const res = await axios.post("/rollback-code", {
        file: snippetFile,
      });
      alert("Rolled back " + res.data?.rolledBack);
    } catch (err) {
      alert("Rollback failed: " + err.message);
    }
  }

  return (
    <aside className="snippet-side card-style">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h6 className="m-0">API Code Snippet</h6>
        <div className="d-flex gap-2">
          <button onClick={saveCode} className="btn btn-sm btn-outline-light">
            <i className="bi bi-save"></i>
          </button>
          <button onClick={rollbackCode} className="btn btn-sm btn-outline-light">
            <i className="bi bi-arrow-counterclockwise"></i>
          </button>
          <button onClick={onExpand} className="btn btn-sm btn-outline-light">
            <i className="bi bi-arrows-fullscreen"></i>
          </button>
        </div>
      </div>
      <div ref={editorRef} className="monaco-container"></div>
    </aside>
  );
}
