// filename: server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { generateReactFlowData, generateFileFlowData } from "./utils/reactFlowGenerator.js";
import { saveSnapshot, undo } from "./utils/codeHistory.js"; 
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Serve React build (for production)
app.use(express.static(path.join(__dirname, "flowchart-ui/public")));

// ✅ Project-level flow
app.get("/api/flow/project", (req, res) => {
  try {
    const projectPath =
      req.query.path || path.resolve(process.cwd(), "sample/frontend");
    const flowData = generateReactFlowData(projectPath);
    res.json(flowData);
  } catch (err) {
    console.error("❌ Error generating project flow:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ File-level flow
app.get("/api/flow/file", (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath)
      return res.status(400).json({ error: "Missing ?path=..." });

    const flowData = generateFileFlowData(filePath);
    res.json(flowData);
  } catch (err) {
    console.error("❌ Error generating file flow:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ OpenAI init
console.log("🔑 OpenAI Key present?", !!process.env.OPENAI_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Explain code snippet
// app.post("/api/explain", async (req, res) => {
//   try {
//     const { code } = req.body;
//     if (!code) return res.status(400).json({ error: "Missing code snippet" });

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content:
//             "You are a code assistant. Explain code very briefly and clearly in 2-3 sentences max.",
//         },
//         {
//           role: "user",
//           content: `Explain this code snippet:\n\n${code}`,
//         },
//       ],
//     });

//     const explanation = response.choices[0].message.content.trim();
//     res.json({ explanation });
//   } catch (err) {
//     console.error("❌ Error in /api/explain:", err.response?.data || err.message);
//     res.status(500).json({ error: "Failed to explain code" });
//   }
// });

// ✅ Update code in file
app.post("/api/code/update", (req, res) => {
  try {
    const { filePath, newCode } = req.body;
    console.log("📝 Update request:", filePath); 
    if (!filePath || !newCode)
      return res.status(400).json({ error: "Missing filePath or newCode" });

    const result = saveSnapshot(filePath, newCode);
    console.log("✅ Saved file:", filePath);
    res.json(result);
  } catch (err) {
    console.error("❌ Error in /api/code/update:", err);
    res.status(500).json({ error: "Failed to update file" });
  }
});



app.post("/api/code/undo", (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath)
      return res.status(400).json({ error: "Missing filePath" });

    const result = undo(filePath);
    res.json(result);
  } catch (err) {
    console.error("❌ Error in /api/code/undo:", err);
    res.status(500).json({ error: "Failed to undo" });
  }
});


app.use((req, res) => {
  res.sendFile(path.join(__dirname, "flowchart-ui/build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
