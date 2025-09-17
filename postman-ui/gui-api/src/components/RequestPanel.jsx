import React from "react";

export default function RequestPanel({
  method,
  setMethod,
  base,
  setBase,
  url,
  setUrl,
  params,
  setParams,
  headers,
  setHeaders,
  auth,
  setAuth,
  body,
  setBody,
  sendRequest,
  fetchAiSuggestions,
}) {
  function formatBody() {
    try {
      setBody(JSON.stringify(JSON.parse(body), null, 2));
    } catch {
      alert("Invalid JSON body");
    }
  }

  function clearBody() {
    setBody("");
  }

  return (
    <div className="workspace">
      <div className="card-style request-row d-flex gap-2 align-items-center">
        <div style={{ minWidth: 120 }}>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="method-select w-100"
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
            <option>PATCH</option>
          </select>
        </div>

        <div style={{ width: 220 }}>
          <select
            value={base}
            onChange={(e) => {
              setBase(e.target.value);
              setUrl(e.target.value + "/signup");
            }}
            className="method-select w-100"
          >
            <option value="http://localhost:3000">localhost:3000</option>
            <option value="http://localhost:4000">localhost:4000</option>
            <option value="http://localhost:5173">localhost:5173</option>
          </select>
        </div>

        <input
          className="url-input flex-fill"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://localhost:3000/signup"
        />

        <div className="controls d-flex align-items-center gap-2">
          <button onClick={sendRequest} className="btn btn-primary send-btn">
            <i className="bi bi-lightning-charge-fill"></i> Send
          </button>
        </div>
      </div>

      <ul className="nav nav-tabs mt-3" role="tablist">
        <li className="nav-item">
          <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#bodyTab">
            Body
          </button>
        </li>
        <li className="nav-item">
          <button className="nav-link" data-bs-toggle="tab" data-bs-target="#paramsTab">
            Params
          </button>
        </li>
        <li className="nav-item">
          <button className="nav-link" data-bs-toggle="tab" data-bs-target="#authTab">
            Auth
          </button>
        </li>
        <li className="nav-item">
          <button className="nav-link" data-bs-toggle="tab" data-bs-target="#headersTab">
            Headers
          </button>
        </li>
      </ul>

      <div className="tab-content card-style request-tabs-content">
        <div className="tab-pane fade show active" id="bodyTab">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} className="json-input large" />
          <div className="d-flex gap-2 mt-2">
            <button onClick={formatBody} className="btn btn-outline-light small">
              <i className="bi bi-code-slash"></i> Format
            </button>
            <button onClick={clearBody} className="btn btn-outline-light small">
              <i className="bi bi-x-lg"></i> Clear
            </button>
            <button onClick={fetchAiSuggestions} className="btn btn-outline-light small ms-auto">
              <i className="bi bi-robot"></i> AI Suggestions
            </button>
          </div>
        </div>

        <div className="tab-pane fade" id="paramsTab">
          <textarea
            value={params}
            onChange={(e) => setParams(e.target.value)}
            className="json-input"
            placeholder="foo=1&bar=2"
          />
        </div>

        <div className="tab-pane fade" id="authTab">
          <textarea
            value={auth}
            onChange={(e) => setAuth(e.target.value)}
            className="json-input"
            placeholder="Authorization: Bearer ..."
          />
        </div>

        <div className="tab-pane fade" id="headersTab">
          <textarea
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            className="json-input"
            placeholder="Key: Value"
          />
          <div className="muted-note tiny mt-1">
            Enter each header on its own line (Key: Value)
          </div>
        </div>
      </div>
    </div>
  );
}
