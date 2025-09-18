import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import RequestPanel from "./components/RequestPanel";
import ResponsePanel from "./components/ResponsePanel";
import SnippetPanel from "./components/SnippetPanel";
import FullscreenEditor from "./components/FullscreenEditor";
import axios from "axios";

// Import Bootstrap JS so tabs work
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Helper for truncating long URLs
function truncate(s, n = 40) {
  return s && s.length > n ? s.slice(0, n - 1) + "…" : s || "";
}

export default function App() {
  // Request state
  const [method, setMethod] = useState("POST");
  const [base, setBase] = useState("http://localhost:3000");
  const [url, setUrl] = useState("http://localhost:3000/signup");
  const [params, setParams] = useState("");
  const [headers, setHeaders] = useState("");
  const [auth, setAuth] = useState("");
  const [body, setBody] = useState(
    JSON.stringify({ email: "test@example.com", password: "Passw0rd!" }, null, 2)
  );

  // Response/meta state
  const [response, setResponse] = useState(null);
  const [status, setStatus] = useState("—");
  const [meta, setMeta] = useState({ time: "—", size: "—", url: "—" });

  // Logs
  const [history, setHistory] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // Code panel
  const [snippetCode, setSnippetCode] = useState("// Loading code…");
  const [snippetFile, setSnippetFile] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("apitester_history_v2");
    if (raw) setHistory(JSON.parse(raw));
  }, []);

  // Save history whenever updated
  useEffect(() => {
    localStorage.setItem("apitester_history_v2", JSON.stringify(history));
  }, [history]);

  // === Prefill from CLI (gui-prefill.json) ===
  useEffect(() => {
    async function loadPrefill() {
      try {
        const res = await axios.get("../../public/gui-prefill.json", {
          headers: { "Cache-Control": "no-store" },
        });
        if (res.data) {
          const pref = res.data;

          if (pref.method) setMethod(pref.method.toUpperCase());
          if (pref.baseUrl) setBase(pref.baseUrl);
          if (pref.endpoint) {
            const endpoint = pref.endpoint.startsWith("/")
              ? pref.endpoint
              : "/" + pref.endpoint;
            setUrl((pref.baseUrl || base).replace(/\/$/, "") + endpoint);
          }
          if (pref.body) {
            setBody(
              typeof pref.body === "string"
                ? pref.body
                : JSON.stringify(pref.body, null, 2)
            );
          }
          if (pref.headers) {
            const hdrLines = Object.entries(pref.headers)
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n");
            setHeaders(hdrLines);
            if (pref.headers.Authorization) setAuth(pref.headers.Authorization);
          }
        }
      } catch (err) {
        console.log("No prefill found:", err.message);
      }
    }
    loadPrefill();
  }, [base]);

  // === Auto-load first available code snippet ===
  useEffect(() => {
    async function loadInitialCode() {
      try {
        const routesRes = await axios.get("/routes");
        const routes = routesRes.data || [];
        if (routes.length > 0) {
          const first = routes[0];
          const codeRes = await axios.get("/code", { params: { file: first.file } });
          setSnippetFile(first.file);
          setSnippetCode(codeRes.data || "// no code found");
        }
      } catch (err) {
        console.error("❌ Failed to load initial code:", err.message);
      }
    }
    loadInitialCode();
  }, []);

  // === Send request through backend proxy ===
  async function sendRequest() {
    let finalUrl = url.trim();
    if (!finalUrl) return alert("Enter URL");

    if (params) {
      finalUrl += (finalUrl.includes("?") ? "&" : "?") + params;
    }

    let hdrs = {};
    if (headers) {
      headers.split(/\r?\n/).forEach((l) => {
        const idx = l.indexOf(":");
        if (idx > -1) hdrs[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
      });
    }
    if (auth) hdrs["Authorization"] = auth;

    let data = undefined;
    if (method !== "GET") {
      try {
        data = JSON.parse(body || "{}");
      } catch {
        alert("Invalid JSON in body");
        return;
      }
    }

    const t0 = performance.now();
    try {
      const res = await axios.post("/proxy", {
        url: finalUrl,
        method,
        headers: hdrs,
        body: data,
      });

      const took = Math.round(performance.now() - t0);
      setResponse(res.data);
      setStatus(res.data.status || "—");
      setMeta({
        time: took + " ms",
        size: JSON.stringify(res.data.data || "").length + " bytes",
        url: truncate(finalUrl, 180),
      });

      // Update logs
      setTimeline((t) => [
        { method, url: finalUrl, status: res.data.status, took },
        ...t.slice(0, 29),
      ]);
      setHistory((h) => [
        { method, url: finalUrl, headers, body },
        ...h.slice(0, 49),
      ]);
    } catch (err) {
      setResponse({ error: err.message });
      setStatus("ERR");
      setMeta({ time: "—", size: "—", url: finalUrl });
    }
  }

  // === AI Suggestions ===
  async function fetchAiSuggestions() {
    try {
      const endpoint = new URL(url).pathname || "/";
      const res = await axios.post("/generate-testcases", {
        endpoint,
        numCases: 5,
      });
      setAiSuggestions(res.data.cases || []);
    } catch (err) {
      setAiSuggestions([{ name: "AI failed", data: { error: err.message } }]);
    }
  }

  return (
    <div className="container-app">
      <Header />
      <div className="layout-grid">
        <Sidebar setSnippetCode={setSnippetCode} setSnippetFile={setSnippetFile} />

        <main className="workspace">
          <RequestPanel
            method={method}
            setMethod={setMethod}
            base={base}
            setBase={setBase}
            url={url}
            setUrl={setUrl}
            params={params}
            setParams={setParams}
            headers={headers}
            setHeaders={setHeaders}
            auth={auth}
            setAuth={setAuth}
            body={body}
            setBody={setBody}
            sendRequest={sendRequest}
            fetchAiSuggestions={fetchAiSuggestions}
          />
          <ResponsePanel
            response={response}
            status={status}
            meta={meta}
            history={history}
            timeline={timeline}
            aiSuggestions={aiSuggestions}
            setBody={setBody}
          />
        </main>

        <SnippetPanel
          snippetCode={snippetCode}
          setSnippetCode={setSnippetCode}
          snippetFile={snippetFile}
          onExpand={() => setFullscreen(true)}   // ✅ correct
        />

      </div>

      {fullscreen && (
        <FullscreenEditor
  snippetCode={snippetCode}
  setSnippetCode={setSnippetCode}
  snippetFile={snippetFile}
  open={fullscreen}
  setOpen={setFullscreen}
/>

      )}
    </div>
  );
}
