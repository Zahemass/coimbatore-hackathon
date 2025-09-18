import React, { useEffect, useState } from "react";
import axios from "axios";
import RoutesPng from "../assets/routes.png";

export default function Sidebar({ setSnippetCode, setSnippetFile }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRouteOpen, setIsRouteOpen] = useState(false);

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
      setSnippetCode(res.data || "// no code found");
      setSnippetFile(file);
    } catch (err) {
      setSnippetCode("// ❌ Failed to load code: " + err.message);
    }
  }

  useEffect(() => {
    if (isRouteOpen) {
      loadRoutes();
      document.documentElement.style.setProperty("--navbar-gap-with", "340px");
    } else {
      document.documentElement.style.setProperty("--navbar-gap-with", "100px");

    }
  }, [isRouteOpen]);

  const Routes = {
    "/signup": "POST",
    "/login": "POST",
    "/logout": "POST",
    "/profile": "GET",
    "/profile/update": "PUT",
    "/profile/delete": "DELETE",
    "/settings": "GET",
    "/settings/update": "PATCH",
    "/posts": "GET",
    "/posts/create": "POST",
    "/posts/:id": "GET",
    "/posts/:id/update": "PUT",
    "/posts/:id/delete": "DELETE",
    "/comments": "GET",
    "/comments/add": "POST",
    "/comments/:id": "DELETE",
    "/notifications": "GET",
    "/messages": "GET",
    "/messages/send": "POST",
    "/search": "GET",
  };


  return (
    <>
      <div className="sidebar-container" style={{ display: "flex" }}>
        {/* Main Sidebar */}
        <aside className="sidebar card-style">
          <span
            onClick={() => setIsRouteOpen(!isRouteOpen)}
            className="Router-icon-text"
            style={{ cursor: "pointer" }}
          >
            <img src={RoutesPng} alt="routes logo" />
            <br />
            Routes
          </span>
        </aside>

        {/* Separate Routes Sidebar (opens BESIDE main nav, not inside) */}
        {isRouteOpen && (
          <aside className="routes-panel card-style" style={{ width: "240px", marginLeft: "8px", maxHeight: "calc(50vh - 80px)", overflowY: "auto" }}>
            <div className="routes-list">
              <p>
                <img src={RoutesPng} alt="routes logo" /> Routes
              </p>

              {/* {loading && <div className="tiny muted-note">Loading…</div>}
            {!loading && routes.length === 0 && (
              <div className="tiny muted-note">No routes found</div>
            )} */}

              {routes.map((r, i) => (
                <div
                  key={i}
                  className="list-item"
                  onClick={() => loadCode(r.file, r.path)}
                  style={{ cursor: "pointer", margin:"1rem" }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div className="badge-verb request-method" style={{
                      backgroundColor: r === "POST" ? "var(--method-color-post)" : "var(--method-color-get)"
                    }}>{r.method}</div>
                    <div style={{ fontWeight: 700 }}>{r.path}</div>
                  </div>
                  {/* <div className="tiny muted-note">{r.file}</div> */}
                </div>
              ))}

              {/*  */}
              {/* {Object.entries(Routes).map(([path, method], i) => (
              <div
                key={i}
                className="hist-item"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  // optional: show dummy code when clicked
                  setSnippetCode?.(`// Example code for ${method} ${path}`);
                  setSnippetFile?.("dummy.js");
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div
                    className="request-method"
                    style={{
                      backgroundColor: method === "POST" ? "var(--method-color-post)" : "var(--method-color-get)"
                    }}
                  >
                    {method}
                  </div>

                  <div style={{ fontWeight: 700 }}>{path}</div>
                </div>
              </div>
            ))} */}

              {/*  */}
            </div>


          </aside>
        )}
      </div>
    </>
  );
}