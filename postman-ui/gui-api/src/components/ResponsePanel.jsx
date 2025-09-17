import React from "react";

export default function ResponsePanel({
  response,
  status,
  meta,
  history,
  timeline,
  aiSuggestions,
  setBody,
}) {
  function copyResponse() {
    if (!response?.data) return;
    navigator.clipboard.writeText(
      typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data, null, 2)
    );
    alert("Copied response");
  }

  return (
    <div className="response-section">
      <ul className="nav nav-tabs mt-3" role="tablist">
        <li className="nav-item">
          <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#respTab">
            Response
          </button>
        </li>
        <li className="nav-item">
          <button className="nav-link" data-bs-toggle="tab" data-bs-target="#aiTab">
            AI
          </button>
        </li>
        <li className="nav-item">
          <button className="nav-link" data-bs-toggle="tab" data-bs-target="#historyTab">
            History
          </button>
        </li>
        <li className="nav-item">
          <button className="nav-link" data-bs-toggle="tab" data-bs-target="#timelineTab">
            Timeline
          </button>
        </li>
      </ul>

      <div className="tab-content card-style response-tabs-content flex-fill">
        <div className="tab-pane fade show active d-flex flex-column" id="respTab">
          <div className="response-meta d-flex align-items-center gap-2">
            <div className="status-badge">{status || "—"}</div>
            <div className="meta-pill">{meta.time}</div>
            <div className="meta-pill">{meta.size}</div>
            <div className="meta-pill flex-fill">{meta.url}</div>
          </div>
          <div className="response-box">
            {response
              ? typeof response.data === "string"
                ? response.data
                : JSON.stringify(response.data, null, 2)
              : "— no response yet —"}
          </div>
          <div className="d-flex gap-2 mt-3">
            <button onClick={copyResponse} className="btn btn-outline-light small">
              <i className="bi bi-clipboard"></i> Copy
            </button>
          </div>
        </div>

        <div className="tab-pane fade" id="aiTab">
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

        <div className="tab-pane fade" id="historyTab">
          {history.length === 0 && (
            <div className="tiny muted-note">No saved history</div>
          )}
          {history.map((h, i) => (
            <div key={i} className="hist-item">
              <div>
                <b>{h.method}</b> {h.url}
              </div>
              <div className="tiny muted-note">{h.status}</div>
            </div>
          ))}
        </div>

        <div className="tab-pane fade" id="timelineTab">
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
      </div>
    </div>
  );
}
