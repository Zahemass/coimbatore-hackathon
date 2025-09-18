import React from "react";

export default function NodeSmall({ data }) {
  return (
    <div className="small-node">

      <div className="small-title">{data.label}</div>
      <div className="small-kind">
        {data.kind || "symbol"} • {data.fileType || "js"}
      </div>
      {data.description && <div className="small-desc">{data.description}</div>}
    </div>
  );
}
