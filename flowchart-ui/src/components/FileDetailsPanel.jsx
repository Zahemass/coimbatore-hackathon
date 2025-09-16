// filename: components/FileDetailsPanel.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/fileDetails.css";
import { fetchExplanation } from "../utils/api";

export default function FileDetailsPanel({
  symbol,
  fileNode,
  onClose,
  onEdit,
}) {
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);

  const data = symbol ? symbol.data : fileNode?.data;

  useEffect(() => {
    if (data) handleExplain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, fileNode]);

  const handleExplain = async () => {
    if (!data?.code && !data?.snippet) return;
    setLoading(true);
    try {
      const result = await fetchExplanation(data.code || data.snippet);
      setExplanation(result.explanation);
    } catch (err) {
      console.error("❌ Explanation fetch error:", err);
      setExplanation("❌ Failed to fetch explanation.");
    } finally {
      setLoading(false);
    }
  };

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
              <div className="muted">
                {data?.relPath || data?.absPath || "unknown"}
              </div>
            </div>
            <button onClick={onClose} className="close-btn">
              ✖
            </button>
          </div>

          {/* Code Preview */}
          <div className="card">
            <h4 className="card-title">Code</h4>
            <pre>
              <code className="language-js">
                {data?.code || data?.snippet}
              </code>
            </pre>
            <button
              className="edit-btn"
              onClick={() =>
                onEdit(
                  data?.absPath || data?.relPath, // ✅ prefer absolute path
                  data?.code || data?.snippet
                )
              }
            >
              ✏️ Edit Code
            </button>
          </div>

          {/* Explanation */}
          <div className="card">
            <h4 className="card-title">Explanation</h4>
            {loading ? (
              <p>⏳ Generating explanation...</p>
            ) : (
              <p>{explanation || "No explanation available."}</p>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
