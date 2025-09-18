// gui-api/src/components/ResponsePanel.jsx
import React, { useState, useEffect } from "react";

export default function ResponsePanel({
  response,
  status,
  meta,
  history,
  timeline,
  aiSuggestions,
  rcaText,          // ✅ RCA content passed in
  setBody,
  switchToAiTab,
  switchToRcaTab,  // ✅ toggle to RCA automatically on failure
}) {
  const [activeTab, setActiveTab] = useState("respTab");

  useEffect(() => {
    if (switchToAiTab) setActiveTab("aiTab");
  }, [switchToAiTab]);

  // ✅ Whenever switchToRcaTab changes, show RCA tab
  useEffect(() => {
    if (switchToRcaTab || (status && status.toString().startsWith("4")) || (status && status.toString().startsWith("5"))) {
      setActiveTab("rcaTab");
    }
  }, [switchToRcaTab, status]);

  function copyResponse() {
    if (!response?.data) return;
    navigator.clipboard.writeText(
      typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data, null, 2)
    );
    alert("Copied response");
  }

  function statusClass(code) {
    if (!code) return "";
    if (code.toString().startsWith("2")) return "status-2xx";
    if (code.toString().startsWith("4")) return "status-4xx";
    if (code.toString().startsWith("5")) return "status-5xx";
    return "";
  }

  return (
    <div className="response-section">
      <ul className="nav nav-tabs mt-3" role="tablist">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "respTab" ? "active" : ""}`}
            onClick={() => setActiveTab("respTab")}
          >
            Response
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "aiTab" ? "active" : ""}`}
            onClick={() => setActiveTab("aiTab")}
          >
            AI Suggestion
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "historyTab" ? "active" : ""}`}
            onClick={() => setActiveTab("historyTab")}
          >
            History
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "timelineTab" ? "active" : ""}`}
            onClick={() => setActiveTab("timelineTab")}
          >
            Timeline
          </button>
        </li>
        {/* ✅ RCA Tab */}
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "rcaTab" ? "active" : ""}`}
            onClick={() => setActiveTab("rcaTab")}
          >
            RCA
          </button>
        </li>
      </ul>

      <div className="tab-content card-style response-tabs-content flex-fill">
        {/* Response Tab */}
        <div className={`tab-pane fade ${activeTab === "respTab" ? "show active" : ""}`}>
          <div className="response-meta d-flex flex-row-reverse align-items-center gap-2">
            <div className={`status-badge ${statusClass(status)}`}>
              {status || "—"}
            </div>
            <div className="meta-pill">{meta.time}</div>
            <div className="meta-pill">{meta.size}</div>
            <div className="ms-auto tiny muted-note">Response</div>
          </div>

          <div className="response-box">
            {response
              ? typeof response.data === "string"
                ? response.data
                : JSON.stringify(response.data, null, 2)
              : "— no response yet —"}
          </div>

          <div className="d-flex gap-2 mt-3">
            <button
              onClick={copyResponse}
              className="btn btn-outline-light small"
            >
              <i className="bi bi-clipboard"></i> Copy
            </button>
          </div>
        </div>

        {/* AI Suggestions Tab */}
        <div className={`tab-pane fade ${activeTab === "aiTab" ? "show active" : ""}`}>
          {aiSuggestions.length === 0 && (
            <div className="ai-panel">
              No suggestions yet — press <b>AI Suggestions</b> in request panel.
            </div>
          )}
          {aiSuggestions.map((s, i) => (
            <div key={i} className="ai-panel">
              <b>{s.name}</b>
              <pre>{JSON.stringify(s.data, null, 2)}</pre>
              <button
                onClick={() => setBody(JSON.stringify(s.data, null, 2))}
                className="btn btn-sm btn-outline-light"
              >
                Use in Body
              </button>
            </div>
          ))}
        </div>

        {/* History Tab */}
        <div
          className={`tab-pane fade ${activeTab === "historyTab" ? "show active" : ""}`}
          style={{ maxHeight: "250px", overflowY: "auto" }}
        >
          {history.length === 0 && (
            <div className="tiny muted-note">No saved history</div>
          )}
          {history.map((h, i) => (
            <div key={i} className="list-item">
              <div>
                <b>{h.method}</b> {h.url}
              </div>
              <div className="tiny muted-note">{h.status}</div>
            </div>
          ))}
        </div>

        {/* Timeline Tab */}
        <div className={`tab-pane fade ${activeTab === "timelineTab" ? "show active" : ""}`}>
          {timeline.length === 0 && (
            <div className="tiny muted-note">
              No timeline yet — send a request to populate.
            </div>
          )}
          {timeline.map((t, i) => (
            <div key={i} className="hist-item">
              <div>
                <b>{t.method}</b> {t.url}
              </div>
              <div className="tiny muted-note">
                {t.status} • {t.took}ms
              </div>
            </div>
          ))}
        </div>

        {/* ✅ RCA Tab */}
        <div className={`tab-pane fade ${activeTab === "rcaTab" ? "show active" : ""}`}>
          {rcaText ? (
            <div className="ai-panel" style={{ whiteSpace: "pre-wrap" }}>
              {rcaText}
            </div>
          ) : (
            <div className="tiny muted-note">
              No RCA yet — run a test and see failures.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
