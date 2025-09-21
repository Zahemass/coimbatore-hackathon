import React, { useState, useEffect } from "react";

import { updateCode, undoCode } from "./utils/api";
import "./styles.css";

export default function App() {
  const [view, setView] = useState("project"); // "project" | "file"
  c
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
