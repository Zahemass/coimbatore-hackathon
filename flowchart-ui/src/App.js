import React, { useState, useEffect } from "react";
import ProjectFlow from "./components/ProjectFlow";
import FileFlow from "./components/FileFlow";
import FileDetailsPanel from "./components/FileDetailsPanel";
import HeaderBar from "./components/HeaderBar";
import Sidebar from "./components/Sidebar";
import CodeEditorDrawer from "./components/CodeEditorDrawer";
import { updateCode, undoCode } from "./utils/api";
import "./styles.css";

export default function App() {
  const [view, setView] = useState("project"); // "project" | "file"
  const [activeFile, setActiveFile] = useState(null);
  const [activeSymbol, setActiveSymbol] = useState(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorCode, setEditorCode] = useState("");
  const [editorFilePath, setEditorFilePath] = useState("");

  // Open editor from sidebar or panel
  const handleEdit = (filePath, code) => {
    if (!filePath && activeFile) {
      filePath = activeFile.data?.absPath || activeFile.data?.relPath;
    }
    setEditorFilePath(filePath);
    setEditorCode(code);
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!editorFilePath) return;
    await updateCode(editorFilePath, editorCode);
    alert("✅ File updated");
    setIsEditorOpen(false);
  };

  const handleUndo = async () => {
    if (!editorFilePath) return;
    const result = await undoCode(editorFilePath);
    if (result.success) setEditorCode(result.code);
  };

  const handleCloseDetails = () => {
    if (activeSymbol) {
      setActiveSymbol(null);
    } else {
      setView("project");
      setActiveFile(null);
    }
  };

  // Automatically switch to file view when activeFile changes
  useEffect(() => {
    if (activeFile) setView("file");
  }, [activeFile]);

  return (
    <div className="app-root">
      {/* Sidebar */}
      <Sidebar
        view={view}
        activeFile={activeFile}
        onSelectFile={(file) => {
          setActiveFile(file);
          setActiveSymbol(null);
        }}
        onSelectSymbol={(sym) => setActiveSymbol(sym)}
        onBack={() => {
          setView("project");
          setActiveFile(null);
          setActiveSymbol(null);
        }}
      />

      {/* Main column */}
      <div className="main-column">
        {/* Header */}
        <HeaderBar
          showBack={view === "file"}
          onBack={() => {
            setView("project");
            setActiveFile(null);
            setActiveSymbol(null);
          }}
        />

        {/* Canvas / Flow area */}
        <div className="canvas-area">
          {view === "project" ? (
            <ProjectFlow
              onFileClick={(fileNode) => {
                setActiveFile(fileNode);
                setActiveSymbol(null);
              }}
            />
          ) : (
            activeFile && (
              <FileFlow
                fileNode={activeFile}
                onSelectSymbol={setActiveSymbol}
              />
            )
          )}
        </div>

        {/* File / Symbol Details */}
        <FileDetailsPanel
          symbol={activeSymbol}
          fileNode={activeFile}
          onClose={handleCloseDetails}
          onEdit={handleEdit}
        />

        {/* Bottom code editor */}
        <CodeEditorDrawer
          isOpen={isEditorOpen}
          code={editorCode}
          setCode={setEditorCode}
          onSave={handleSave}
          onUndo={handleUndo}
          onCancel={() => setIsEditorOpen(false)}
        />
      </div>
    </div>
  );
}
