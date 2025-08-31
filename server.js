import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve React build
app.use(express.static(path.join(__dirname, "flowchart-ui/build")));

// 📌 API Route: Generate Flowchart
app.post("/api/generate-flowchart", (req, res) => {
  const { file } = req.body;
  if (!file) {
    return res.status(400).json({ error: "No file specified" });
  }

  const cliProcess = spawn("node", ["cli.js", "flowchart", file], {
    cwd: process.cwd(),
    env: { ...process.env, LAUNCH_UI: "false" },
  });

  let stdout = "";
  let stderr = "";

  cliProcess.stdout.on("data", (data) => {
    stdout += data.toString();
  });

  cliProcess.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  cliProcess.on("close", () => {
    if (stderr) {
      console.error("❌ CLI execution error:", stderr);
    }

    try {
      const jsonStart = stdout.indexOf("{");
      const jsonEnd = stdout.lastIndexOf("}") + 1;
      const jsonString = stdout.slice(jsonStart, jsonEnd);
      const json = JSON.parse(jsonString);
      res.json(json);
    } catch (err) {
      console.error("❌ JSON parse error:", err);
      res.status(500).json({ error: "Failed to parse CLI output", raw: stdout });
    }
  });
});

// Fallback React Routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "flowchart-ui/build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
