// gui-api/src/components/ResponsePanel.jsx
import React, { useState, useEffect } from "react";

export default function ResponsePanel({
  response,
  status,
  meta,
  history,
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
