import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, FileText, List, CornerDownRight } from "lucide-react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import "../styles/DetailsPanel.css";

/**
 * selected prop format:
 * - null
 * - { type: 'file', file: { ...node } }
 * - { type: 'symbol', node: <symbolNode> }
 * - { type: 'edge', edge: <edge> }
 *
 * When a symbol node is selected, node.data.symbol should exist and contain { name, code, kind, ... }
 */

function autoExplain(symbol) {
  if (!symbol) return "";
  const kind = symbol.kind || (symbol.id && symbol.id.includes("hook") ? "hook" : "symbol");
  let expl = `${symbol.name || symbol.label || symbol.id} — ${kind}.`;
  if (symbol.kind === "hook" || (symbol.name && symbol.name.startsWith("use"))) {
    expl += " Custom hook: likely manages state/effects and returns values or callbacks.";
  } else if (symbol.kind === "component" || /^[A-Z]/.test(symbol.name || "")) {
    expl += " React component: renders JSX and may manage local state, effects or props.";
  } else if (symbol.kind === "context") {
    expl += " React context definition/provider.";
  }
  if (symbol.code && symbol.code.length < 600) expl += `\n\nCode preview:\n${symbol.code.slice(0, 300)}`;
  return expl;
}

export default function DetailsPanel({ selected, onClose }) {
  const [visible, setVisible] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    setVisible(Boolean(selected));
    if (selected && selected.type === "symbol" && selected.node?.data?.symbol) {
      setPreview(selected.node.data.symbol);
    } else if (selected && selected.type === "file") {
      setPreview({ name: selected.file?.data?.label || selected.file?.id, code: selected.file?.data?.code, kind: "file" });
    } else if (selected && selected.type === "edge") {
      setPreview(null);
    } else {
      setPreview(null);
    }
    // highlight after render
    setTimeout(() => Prism.highlightAll(), 40);
  }, [selected]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="details-panel"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
        >
          <button className="close-btn" onClick={() => { setVisible(false); onClose && onClose(); }}>
            ✖
          </button>

          {!selected && <div style={{ padding: 12 }}>No item selected</div>}

          {selected && selected.type === "file" && (
            <>
              <h2>📂 {selected.file?.data?.label || selected.file?.id}</h2>
              <div className="detail-card">
                <p style={{ margin: 0, color: "#cbd5e1" }}>{selected.file?.data?.relPath || selected.file?.id}</p>
                <div style={{ marginTop: 8, whiteSpace: "pre-wrap", fontSize: 13, color: "#e6eef8" }}>
                  {selected.file?.data?.summary || selected.file?.data?.description || (selected.file?.data?.symbols ? `Contains ${(selected.file.data.symbols.components||[]).length} components and ${(selected.file.data.symbols.hooks||[]).length} hooks.` : "")}
                </div>
              </div>

              {/* If file has subFlow, render mini flow */}
              {selected.file?.data?.subFlow && (
                <div className="detail-card">
                  <h3>📂 File Flowchart</h3>
                  <div style={{ height: 260, borderRadius: 8, overflow: "hidden" }}>
                    <ReactFlow
                      nodes={selected.file.data.subFlow.nodes || []}
                      edges={selected.file.data.subFlow.edges || []}
                      fitView
                    >
                      <Background gap={16} color="#555" />
                      <MiniMap nodeColor={() => "#10b981"} />
                      <Controls />
                    </ReactFlow>
                  </div>
                </div>
              )}
            </>
          )}

          {selected && selected.type === "symbol" && preview && (
            <>
              <h2>🔎 {preview.name || preview.label}</h2>

              <div className="detail-card">
                <p style={{ margin: 0, color: "#cbd5e1" }}><strong>Kind:</strong> {preview.kind || preview.type || "symbol"}</p>
              </div>

              <div className="detail-card">
                <Code className="icon" />
                <h3>💻 Code</h3>
                <pre style={{ maxHeight: 320, overflow: "auto" }}>
                  <code className="language-js">{preview.code || preview.snippet || "(no snippet available)"}</code>
                </pre>
              </div>

              <div className="detail-card">
                <h3>🧾 Explanation</h3>
                <div style={{ whiteSpace: "pre-wrap" }}>{autoExplain(preview)}</div>
                <small style={{ color: "#9CA3AF", display: "block", marginTop: 8 }}>
                  Tip: connect a server-side explanation endpoint to generate richer descriptions.
                </small>
              </div>
            </>
          )}

          {selected && selected.type === "edge" && (
            <>
              <h2>🔗 Edge</h2>
              <div className="detail-card">
                <p><b>ID:</b> {selected.edge.id}</p>
                <p><b>Source:</b> {selected.edge.source}</p>
                <p><b>Target:</b> {selected.edge.target}</p>
                <p style={{ marginTop: 8 }}>{selected.edge.data?.type || "edge"}</p>
              </div>
            </>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
