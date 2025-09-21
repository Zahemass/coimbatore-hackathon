// filename: components/CodeEditorDrawer.jsx
import React from "react";
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
