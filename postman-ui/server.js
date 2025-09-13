// postman-ui/server.js
import express from "express";
import path from "path";
import fs from "fs";
import open from "open";
import axios from "axios";
import { fileURLToPath } from "url";
import { generateTestCases, loadTestCasesFromFile } from "../tester.js";
import { extractRoutes } from "../utils/fileparser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

app.use(express.json({ limit: "10mb" }));

const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
app.use(express.static(publicDir));

/* ---------- /generate-testcases ---------- */
app.post("/generate-testcases", async (req, res) => {
  try {
    const { endpoint, numCases = 5 } = req.body || {};
    if (!endpoint) return res.status(400).json({ error: "Missing endpoint" });

    const existing = loadTestCasesFromFile(endpoint);
    if (existing && existing.length > 0) {
      return res.json({ fromCache: true, cases: existing.slice(0, numCases) });
    }

    console.log(`🔎 Generating ${numCases} test cases for ${endpoint}`);
    const cases = await generateTestCases(endpoint, [], numCases);

    const uiTestdataPath = path.join(publicDir, "testdata.json");
    let uiExisting = {};
    if (fs.existsSync(uiTestdataPath)) {
      try {
        uiExisting = JSON.parse(fs.readFileSync(uiTestdataPath, "utf-8"));
      } catch {}
    }
    uiExisting[endpoint] = cases;
    fs.writeFileSync(uiTestdataPath, JSON.stringify(uiExisting, null, 2));

    res.json({ fromCache: false, cases: cases.slice(0, numCases) });
  } catch (err) {
    console.error("❌ /generate-testcases error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- Save result ---------- */
app.post("/save-result", (req, res) => {
  try {
    const out = path.join(__dirname, "apitest-results.json");
    fs.writeFileSync(out, JSON.stringify(req.body, null, 2));
    res.json({ ok: true, savedTo: out });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ---------- Routes scanner ---------- */
let rollbackCache = {};

// Only scan sample/ folder for backend routes
// keep rollbackCache and extractRoutes imports at top

// --- NEW: remember which file was chosen by CLI ---
const prefillPath = path.join(publicDir, "gui-prefill.json");

// Routes endpoint should read the file from prefill instead of scanning all js
app.get("/routes", (req, res) => {
  try {
    let targetFile = null;

    if (fs.existsSync(prefillPath)) {
      const pref = JSON.parse(fs.readFileSync(prefillPath, "utf-8"));
      if (pref && pref.file) {
        targetFile = pref.file; // CLI wrote this (absolute or relative)
      }
    }

    if (!targetFile) {
      return res.status(400).json({ error: "No file selected by CLI (gui-prefill.json missing)" });
    }

    const routes = extractRoutes(targetFile);
    console.log(`✅ Using CLI-selected file: ${targetFile}, found ${routes.length} routes`);

    res.json(routes.map(r => ({ ...r, file: targetFile })));
  } catch (err) {
    console.error("❌ /routes error:", err.message || err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- Code fetching ---------- */
app.get("/code", (req, res) => {
  const { file, endpoint } = req.query;
  if (!file) return res.status(400).send("Missing file");

  try {
    const code = fs.readFileSync(file, "utf-8");
    rollbackCache[file] = code;

    if (endpoint && code.includes(endpoint)) {
      const lines = code.split("\n");
      let start = -1, end = -1, depth = 0;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(endpoint) && start === -1) {
          start = i;
          depth = 0;
        }
        if (start !== -1) {
          if (lines[i].includes("{")) depth++;
          if (lines[i].includes("}")) depth--;
          if (depth <= 0 && lines[i].includes("});")) {
            end = i;
            break;
          }
        }
      }

      if (start !== -1 && end !== -1) {
        return res.send(lines.slice(start, end + 1).join("\n"));
      }
    }

    res.send(code); // fallback: send whole file
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* ---------- Proxy (perform request server-side to avoid CORS) ---------- */
app.post("/proxy", express.json({ limit: "10mb" }), async (req, res) => {
  try {
    const { url, method = "GET", headers = {}, body } = req.body || {};
    if (!url) return res.status(400).json({ error: "Missing url" });

    // perform upstream request server-side (avoid CORS)
    const resp = await axios({
      method: method.toLowerCase(),
      url,
      headers,
      data: body,
      timeout: 20000,
      validateStatus: () => true,
    });

    // forward structured response
    return res.json({
      proxied: true,
      status: resp.status,
      headers: resp.headers,
      data: resp.data,
    });
  } catch (err) {
    console.error("❌ /proxy error:", err.message || err);
    return res.status(500).json({ proxied: false, error: err.message || "Proxy error" });
  }
});

/* ---------- Save & Rollback ---------- */
app.post("/save-code", (req, res) => {
  const { code, file } = req.body;
  if (!file || !code) return res.status(400).json({ error: "Missing file or code" });

  try {
    fs.writeFileSync(file, code, "utf-8");
    res.json({ ok: true, savedTo: file });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/rollback-code", (req, res) => {
  const { file } = req.body;
  if (!file || !rollbackCache[file]) {
    return res.status(400).json({ error: "No rollback snapshot for this file" });
  }
  try {
    fs.writeFileSync(file, rollbackCache[file], "utf-8");
    res.json({ ok: true, rolledBack: file });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------- SPA fallback ---------- */
app.use((req, res) => {
  const indexPath = path.join(publicDir, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("UI not found.");
  }
});

/* ---------- Start ---------- */
const server = app.listen(PORT, async () => {
  const url = `http://localhost:${PORT}`;
  console.log(`✅ GUI server running at ${url}`);
  try {
    await open(url);
    console.log("🔗 opened browser to", url);
  } catch {
    console.log("⚠️ auto-open failed; open manually:", url);
  }
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
