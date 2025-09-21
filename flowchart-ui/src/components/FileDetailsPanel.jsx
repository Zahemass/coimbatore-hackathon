// filename: components/FileDetailsPanel.jsx
import React, { useEffect, useState } from "react";
import "../styles/fileDetails.css";

export default function FileDetailsPanel({
  symbol,
  fileNode,
  onClose,
  onEdit, // opens CodeEditorDrawer with path + code
  onSelectFile, // ✅ NEW: pass selected file + code to parent (HeaderBar)
}) {
  ct-hooks/exhaustive-deps
  }, [symbol, fileNode]);

  const handleExplain = async () => {
    if (!fileCode) return;
    setLoadingExplain(true);
    try {
      const result = await fetchExplanation(fileCode);
      setExplanation(result.explanation);
    } catch (err) {
      console.error("❌ Explanation fetch error:", err);
      setExplanation("❌ Failed to fetch explanation.");
    } finally {
      setLoadingExplain(false);
    }
  };

  const handleSuggest = async () => {
 ggest(false);
    }
  };

  // ✅ Apply refactor → calls backend and opens editor with optimized code
  const handleRefactor = async () => {
    if (!fileCode) return;
    setLoadingRefactor(true);
    try {
      const result = await fetchRefactor(fileCode);
      onEdit(filePath, result.refactoredCode);
    } catch (err) {
      console.error("❌ Refactor fetch error:", err);
      alert("❌ Failed to refactor code.");
    } finally {
      setLoadingRefactor(false);
    }
  };

  const renderSuggestion = (text) => {
  
        )}
        {optimalMatch && (
          <p style={{ color: "limegreen", fontWeight: "bold" }}>
            ✅ {optimalMatch[1].trim()}
          </p>
        )}
        {!currentMatch && !suggestMatch && !optimalMatch && <p>{text}</p>}
      </div>
    );
  };

  const isOptimal = suggestion.includes("✅");

  return (
    <AnimatePresence>
      {data && (
        <motion.aside
          className="details-panel"
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          transition={{ type: "spring" }}
        >
          {/* Header */}
          <div className="panel-header">
            <div>
              <h3>{data?.label || data?.name || "File"}</h3>
              <div className="muted">{filePath}</div>
            </div>
            <button onClick={onClose} className="close-btn">
              ✖
            </button>
          </div>

          {/* Code Preview */}
          <div className="card">
            <h4 className="card-title">Code</h4>
            <pre>
              <code className="language-js">{fileCode}</code>
            </pre>
            <button
              className="edit-btn"
              onClick={() => onEdit(filePath, fileCode)}
            >
              ✏️ Edit Code
            </button>
          </div>

          {/* Explanation */}
          <div className="card">
            <h4 className="card-title">Explanation</h4>

          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}