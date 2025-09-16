import React from "react";
import { Handle } from "reactflow";

export default function FileNode({ id, data }) {
  const label = data?.label || id.split("/").pop();
  const rel = data?.relPath || "";
  return (
    <div className="file-node">
      <div className="file-node-header">
        <div className="file-title">{label}</div>
        <div className="file-badge">
          {data?.symbols
            ? `${(data.symbols.components || []).length} comps`
            : "file"}
        </div>
      </div>
      <div className="file-path">{rel}</div>
      <Handle type="target" position="left" style={{ background: "#9CA3AF" }} />
      <Handle
        type="source"
        position="right"
        style={{ background: "#9CA3AF" }}
      />
    </div>
  );
}
