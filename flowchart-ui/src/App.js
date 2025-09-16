import React, { useState } from "react";
import ProjectFlow from "./components/ProjectFlow";
import FileFlow from "./components/FileFlow";
import FileDetailsPanel from "./components/FileDetailsPanel";
import HeaderBar from "./components/HeaderBar";
import Sidebar from "./components/Sidebar";
import CodeEditorDrawer from "./components/CodeEditorDrawer"; // ✅ new
import { updateCode, undoCode } from "./utils/api"; // ✅ helpers
import "./styles.css";

export default function App() {
  const [activeFile, setActiveFile] = useState(null);
  const [activeSymbol, setActiveSymbol] = useState(null);
  const [showFileFlow, setShowFileFlow] = useState(false);

  // ✅ editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorCode, setEditorCode] = useState("");
  const [editorFilePath, setEditorFilePath] = useState("");

  // open editor from sidebar panel
  const handleEdit = (filePath, code) => {
    setEditorFilePath(filePath);
    setEditorCode(code);
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    await updateCode(editorFilePath, editorCode);
    alert("✅ File updated");
    setIsEditorOpen(false);
  };

  const handleUndo = async () => {
    const result = await undoCode(editorFilePath);
    if (result.success) {
      setEditorCode(result.code);
    }
  };

  return (
    <div className="app-root">
      {/* Sidebar */}
      <Sidebar
        onSelectFile={(file) => {
          setActiveFile(file);
          setShowFileFlow(true);
        }}
      />

      {/* Main column */}
      <div className="main-column">
        <HeaderBar
          onBack={() => {
            setShowFileFlow(false);
            setActiveSymbol(null);
            setActiveFile(null);
          }}
          showBack={showFileFlow}
        />

        {/* Flowchart canvas */}
        <div className="canvas-area">
          {!showFileFlow ? (
            <ProjectFlow
              onFileClick={(fileNode) => {
                setActiveFile(fileNode);
                setShowFileFlow(true);
              }}
              onSelectSymbol={(s) => setActiveSymbol(s)}
            />
          ) : (
            <FileFlow fileNode={activeFile} onSelectSymbol={(s) => setActiveSymbol(s)} />
          )}
        </div>
      </div>

      {/* Sidebar file details */}
      <FileDetailsPanel
        symbol={activeSymbol}
        fileNode={activeFile}
        onClose={() => setActiveSymbol(null)}
        onEdit={handleEdit} // ✅ pass down edit handler
      />

      {/* Bottom editor drawer */}
      <CodeEditorDrawer
        isOpen={isEditorOpen}
        code={editorCode}
        setCode={setEditorCode}
        onSave={handleSave}
        onUndo={handleUndo}
        onCancel={() => setIsEditorOpen(false)}
      />
    </div>
  );
}
