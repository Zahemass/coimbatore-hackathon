import React, { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import axios from "axios";

export default function FullscreenEditor({
  open,
  setOpen,
  snippetCode,
  setSnippetCode,
}) {
  const editorRef = useRef(null);
  const monacoInstance = useRef(null);

  useEffect(() => {
    if (open && editorRef.current) {
      monacoInstance.current = monaco.editor.create(editorRef.current, {
        value: snippetCode || "// Fullscreen editor",
        language: "javascript",
        theme: "vs-dark",
        automaticLayout: true,
        fontFamily: "Montserrat",
      });
    }

    return () => {
      if (monacoInstance.current) {
        monacoInstance.current.dispose();
        monacoInstance.current = null;
      }
    };
  }, [open]);

  async function saveCode() {
    try {
      const code = monacoInstance.current.getValue();
      const res = await axios.post("/save-code", {
        file: "TEMP_FILE.js", // TODO: integrate actual file from backend
        code,
      });
      alert("Saved: " + (res.data?.savedTo || "unknown file"));
      setSnippetCode(code);
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  }

  async function rollbackCode() {
    try {
      const res = await axios.post("/rollback-code", {
        file: "TEMP_FILE.js", // TODO: integrate actual file from backend
      });
      alert("Rolled back " + res.data?.rolledBack);
    } catch (err) {
      alert("Rollback failed: " + err.message);
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
            <button
              onClick={rollbackCode}
              className="btn btn-sm btn-outline-light"
            >
              <i className="bi bi-arrow-counterclockwise"></i> Rollback
            </button>
          </div>
        </div>
      </div>
      <div ref={editorRef} className="monaco-container fullscreen-monaco"></div>
    </div>
  );
}
