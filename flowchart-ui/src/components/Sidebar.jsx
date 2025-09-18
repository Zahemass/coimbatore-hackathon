import React, { useEffect, useState } from "react";
import { FolderTree } from "lucide-react";
import { fetchProjectFlow, fetchFileFlow } from "../utils/api";
import { FaReact, FaJsSquare, FaPython, FaFileAlt } from "react-icons/fa"; // ✅ icons

export default function Sidebar({ view, activeFile, onSelectFile, onSelectSymbol, onBack }) {
  const [files, setFiles] = useState([]);
  const [symbols, setSymbols] = useState([]);

  // load project files
  useEffect(() => {
    fetchProjectFlow()
      .then((data) => {
        const fileNodes = (data.nodes || [])
          .filter((n) => n.type === "fileNode")
          .map((n) => ({
            id: n.id,
            data: n.data,
          }));
        setFiles(fileNodes);
      })
      .catch((err) => {
        console.error("Error loading project files:", err);
      });
  }, []);

  // open file → fetch functions
  const openFile = async (file) => {
    onSelectFile && onSelectFile(file);
    try {
      const flow = await fetchFileFlow(file.id);
      const funcs = (flow.nodes || [])
        .filter((n) => n.type !== "fileNode")
        .map((n) => ({ id: n.id, label: n.data?.label || n.id, data: n.data }));
      setSymbols(funcs);
    } catch (err) {
      console.error("Error loading file functions:", err);
    }
  };

  // helper → choose icon based on extension
  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFileAlt color="#9CA3AF" />;
    const ext = fileName.split(".").pop();
    switch (ext) {
      case "jsx":
      case "tsx":
        return <FaReact color="#61dafb" />;
      case "js":
        return <FaJsSquare color="#f7df1e" />;
      case "py":
        return <FaPython color="#3776ab" />;
      default:
        return <FaFileAlt color="#9CA3AF" />;
    }
  };

  return (
    <aside
      className="sidebar"
      style={{ width: "250px", color: "#fff", height: "100vh", overflowY: "auto" }}
    >
      {/* Header */}
      <div
        className="sidebar-header"
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <FolderTree size={20} />
          <span style={{ marginLeft: "8px", fontWeight: "bold" }}>
            {view === "file" ? "Functions" : "Project"}
          </span>
        </div>
        {view === "file" && (
          <button
            onClick={onBack}
            style={{
              background: "transparent",
              border: "none",
              color: "#aaa",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            ← Back
          </button>
        )}
      </div>

      <div className="sidebar-body" style={{ padding: "2px" }}>
        {view === "project" ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {files.map((file) => {
              const label = file.data?.label || file.id.split("/").pop();
              return (
                <li
                  key={file.id}
                  onClick={() => openFile(file)}
                  style={{
                    padding: "8px 4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {getFileIcon(label)}
                  <span>{label}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div>
            <h4 style={{ margin: "8px 0", paddingLeft: "8px" }}>
              {activeFile?.data?.label || activeFile?.id.split("/").pop()}
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {symbols.length === 0 ? (
                <p style={{ color: "#aaa", paddingLeft: "8px" }}>No functions found.</p>
              ) : (
                symbols.map((sym) => (
                  <li
                    key={sym.id}
                    onClick={() => onSelectSymbol && onSelectSymbol(sym)}
                    style={{ padding: "6px 8px", cursor: "pointer", fontSize: "13px" }}
                  >
                    ↳ {sym.label}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
