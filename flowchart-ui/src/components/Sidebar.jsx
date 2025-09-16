import React from "react";
import { FolderTree } from "lucide-react";

export default function Sidebar({ onSelectFile }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <FolderTree size={18} /> <span>Project</span>
      </div>
      <div className="sidebar-body">
        <p className="muted">
          Click files on the canvas, or use the project generator to populate
          files.
        </p>
      </div>
    </aside>
  );
}
