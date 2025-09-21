// postman-ui/server.js
import express from "express";
import path from "path";
import fs from "fs";
import open from "open";
import axios from "axios";
import { fileURLToPath } from "url";
import { generateTestCases, loadTestCasesFromFile } from "../tester.js";
import { extractRoutes } from "../utils/fileParser.js";
import { analyzeFailure } from "../utils/rcaAnalyzer.js"; // ✅ add this

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

app.use(express.json({ limit: "10mb" }));

// ---------- Public dir (for testdata/prefill JSON) ----------
const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
app.use("/", express.static(publicDir));

// ---------- React Build ----------
const clientBuildPath = path.join(__dirname, "gui-api", "build");
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
} else {
  console.warn("⚠️ React build folder not found. Run: cd gui-api && npm run build");
}

/* ---------- /generate-testcases ---------- */
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
const prefillPath = path.join(publicDir, "gui-prefill.json");

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

      rca: "RCA unavailable due to proxy failure.",
    });
  }
});


/* ---------- Save & Rollback ---------- */
  const indexPath = path.join(clientBuildPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("React UI not built yet.");
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
