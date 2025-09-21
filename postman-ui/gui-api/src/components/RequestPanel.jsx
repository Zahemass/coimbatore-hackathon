import React, { useState } from "react";

export default function RequestPanel({
  method,
  setMethod,
  url,
  setUrl,
  params,
        <li className="nav-item">
          <button
            className="nav-link"
            data-bs-toggle="tab"
            data-bs-target="#paramsTab"
          >
            Params
          </button>
        </li>
        <li className="nav-item">
          <button
            className="nav-link"
            data-bs-toggle="tab"
            data-bs-target="#authTab"
          >
            Auth
          </button>
        </li>
        <li className="nav-item">
          <button
            className="nav-link"
            data-bs-toggle="tab"
            data-bs-target="#headersTab"
          >
            Headers
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content card-style request-tabs-content">
        {/* Body Tab */}
        <div className="tab-pane fade show active" id="bodyTab">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="json-input large"
          />
          <div className="d-flex gap-2 mt-3">
            <button onClick={formatBody} className="btn btn-outline-light small">
              <i className="bi bi-code-slash"></i> Format
            </button>
            <button onClick={clearBody} className="btn btn-outline-light small">
              <i className="bi bi-x-lg"></i> Clear
            </button>
            <button
              onClick={handleAiSuggestions}
              disabled={loading}
              className="btn btn-outline-light small ms-auto"
            >
              <i className="bi bi-robot"></i> AI Suggestions
            </button>
          </div>
        </div>

        {/* Params Tab */}
        <div className="tab-pane fade" id="paramsTab">
          <textarea
            value={params}
            onChange={(e) => setParams(e.target.value)}
            className="json-input"
            placeholder="foo=1&bar=2"
          />
        </div>

        {/* Auth Tab */}
        <div className="tab-pane fade" id="authTab">
          <textarea
            value={auth}
            onChange={(e) => setAuth(e.target.value)}
            className="json-input"
            placeholder="Authorization: Bearer ..."
          />
        </div>

        {/* Headers Tab */}
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