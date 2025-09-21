// postman-ui/client/src/components/SnippetPanel.jsx
import React, { useEffect, useRef } from "react";
import monaco from "../monacoSetup";
import axios from "axios";

export default function SnippetPanel({
  snippetCode,
      alert("↩️ Rolled back " + res.data?.rolledBack);
    } catch (err) {
      alert("❌ Rollback failed: " + err.message);
    }
  }

  return (
    <aside className="snippet-side card-style">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h6 className="m-0">API Code Snippet</h6>
        <div className="d-flex gap-2">
          <button onClick={saveCode} className="btn btn-sm btn-outline-light" title="Save">
            <i className="bi bi-save"></i>
          </button>
          <button onClick={rollbackCode} className="btn btn-sm btn-outline-light" title="Rollback">
            <i className="bi bi-arrow-counterclockwise"></i>
          </button>
          <button onClick={onExpand} className="btn btn-sm btn-outline-light" title="Fullscreen">
            <i className="bi bi-arrows-fullscreen"></i>
          </button>
        </div>
      </div>
      <div ref={editorRef} className="monaco-container"></div>
    </aside>
  );
}
