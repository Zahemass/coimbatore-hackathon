import React from "react";
import Editor from "@monaco-editor/react";
import "../styles/codeEditorDrawer.css";

export default function CodeEditorDrawer({
  isOpen,
  code,
  setCode,
  onSave,
  onUndo,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="editor-drawer">
      <div className="editor-header">
        <span>Editing File</span>
        <div className="editor-actions">
          <button onClick={onSave}>💾 Save</button>
          <button onClick={onUndo}>↩️ Undo</button>
          <button onClick={onCancel}>❌ Cancel</button>
        </div>
      </div>
      <Editor
        height="40vh"
        defaultLanguage="javascript"
        theme="vs-dark"
        value={code}
        onChange={(v) => setCode(v || "")}
      />
    </div>
  );
}
