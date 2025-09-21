import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import RequestPanel from "./components/RequestPanel";
import ResponsePanel from "./components/ResponsePanel";
import SnippetPanel from "./components/SnippetPanel";
import FullscreenEditor from "./components/FullscreenEditor";
import axios from "axios";

import "bootstrap/dist/js/bootstrap.bundle.min.js";
        console.log("No prefill found:", err.message);
      }
    }
    loadPrefill();
  }, [base]);

  // Load initial code
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

  // === Send request ===
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
      setRcaText(res.data.rca || ""); // ✅ Capture RCA from backend

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
      setRcaText("No RCA generated (proxy error).");
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
      setAiTabTrigger(true);
    } catch (err) {
      setAiSuggestions([{ name: "AI failed", data: { error: err.message } }]);
      setAiTabTrigger(true);
    }
  }

  return (
    <div className="container-app">
      <Header />
      <div className="layout-grid">
        <span>
          <h3 style={{ fontSize: "1rem" }}>workspace</h3>
          <Sidebar setSnippetCode={setSnippetCode} setSnippetFile={setSnippetFile} />
        </span>

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
            switchResponseTab={(tab) => setAiTabTrigger(tab === "aiTab")}
          />

          <ResponsePanel
            response={response}
            status={status}
            meta={meta}
            history={history}
            timeline={timeline}
            aiSuggestions={aiSuggestions}
            rcaText={rcaText}
            switchToRcaTab={!!rcaText}
            setBody={setBody}
            switchToAiTab={aiTabTrigger}
          />
        </main>

        <SnippetPanel
          snippetCode={snippetCode}
          setSnippetCode={setSnippetCode}
          snippetFile={snippetFile}
          onExpand={() => setFullscreen(true)}
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
