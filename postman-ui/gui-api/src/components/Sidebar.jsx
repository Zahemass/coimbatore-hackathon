import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Sidebar({ setSnippetCode, setSnippetFile }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadRoutes() {
    try {
      setLoading(true);
      const res = await axios.get("/routes");
      setRoutes(res.data || []);
    } catch (err) {
      console.error("❌ Failed to load routes:", err.message);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCode(file, endpoint) {
    try {
      const res = await axios.get("/code", { params: { file, endpoint } });
      setSnippetCode(res.data || "// no code");
      setSnippetFile(file);
    } catch (err) {
      setSnippetCode("// ❌ Failed to load code: " + err.message);
    }
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  return (
    <aside className="sidebar card-style">
      <div className="sidebar-top mb-2">
        <div className="routes-title">
          <i className="bi bi-diagram-3"></i> Routes
        </div>
        <div className="muted-note tiny">Click a route to view code</div>
      </div>

      <div className="routes-list">
        {loading && <div className="tiny muted-note">Loading…</div>}
        {!loading && routes.length === 0 && (
          <div className="tiny muted-note">No routes found</div>
        )}
        {routes.map((r, i) => (
          <div
            key={i}
            className="hist-item"
            onClick={() => loadCode(r.file, r.path)}
            style={{ cursor: "pointer" }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className="badge-verb">{r.method}</div>
              <div style={{ fontWeight: 700 }}>{r.path}</div>
            </div>
            <div className="tiny muted-note">{r.file}</div>
          </div>
        ))}
      </div>

      <div className="sidebar-bottom mt-2">
        <button onClick={loadRoutes} className="btn btn-sm btn-outline-light w-100">
          <i className="bi bi-arrow-clockwise"></i> Refresh Routes
        </button>
      </div>
    </aside>
  );
}
