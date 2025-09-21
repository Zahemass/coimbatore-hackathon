import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  }
  if (symbol.code && symbol.code.length < 600) expl += `\n\nCode preview:\n${symbol.code.slice(0, 300)}`;
  return expl;
}

export default function DetailsPanel({ selected, onClose }) {
  const [visible, setVisible] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
   
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
          ]320, overflow: "auto" }}>
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

            </>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
