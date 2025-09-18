// filename: server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { generateReactFlowData, generateFileFlowData } from "./utils/reactFlowGenerator.js";
import { saveSnapshot, undo } from "./utils/codeHistory.js"; 
import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

import { Octokit } from "@octokit/rest";

if (!process.env.GITHUB_TOKEN) {
  console.error("❌ Missing GITHUB_TOKEN in .env");
} else {
  console.log("🔑 GitHub Token loaded:", process.env.GITHUB_TOKEN.slice(0, 6) + "..."); 
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

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

// ✅ AI Suggestion (always return JSON object)
// app.post("/api/suggest", async (req, res) => {
//   try {
//     const { code } = req.body;
//     if (!code) return res.status(400).json({ error: "Missing code snippet" });

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content:
//             "You are a strict code reviewer. Analyze the given code for time/space complexity." +
//             "\nIf the code is already optimal for small/medium projects, respond in this JSON format:" +
//             '\n{"suggestion": "Current: Time O(?), Space O(?). ✅ This is already optimal for your project. Future Enhancement: AI suggests <approach> but use your code for now."}' +
//             "\nIf the code can be improved, respond in this JSON format:" +
//             '\n{"suggestion": "Current: Time O(?), Space O(?). Suggestion: Use <approach> for better efficiency."}' +
//             "\nAlways respond ONLY in valid JSON. No explanations, no markdown.",
//         },
//         {
//           role: "user",
//           content: code,
//         },
//       ],
//       max_tokens: 150,
//     });

//     const text = response.choices[0].message.content.trim();

//     // Parse safe JSON
//     let suggestionObj;
//     try {
//       suggestionObj = JSON.parse(text);
//     } catch (e) {
//       console.error("⚠️ Could not parse AI response, fallback:", text);
//       suggestionObj = { suggestion: text };
//     }

//     // 🔍 Logs
//     console.log("📥 Original Code:", code);
//     console.log("✨ AI Suggestion Object:", suggestionObj);

//     res.json(suggestionObj);
//   } catch (err) {
//     console.error("❌ Error in /api/suggest:", err.response?.data || err.message);
//     res.status(500).json({ error: "Failed to suggest improvements" });
//   }
// });

// ✅ AI Refactor API (analyzes + optimizes, returns only best code)
// ✅ AI Refactor API (analyzes + optimizes, returns only best code)
// app.post("/api/refactor", async (req, res) => {
//   try {
//     const { code } = req.body;
//     if (!code) return res.status(400).json({ error: "Missing code snippet" });

//     // Ask AI to analyze + refactor
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content:
//             "You are a strict code reviewer. First, analyze the given code for its time/space complexity. " +
//             "Then rewrite it in the most efficient way possible. " +
//             "Return ONLY the optimized code. Do not include explanations, markdown, or JSON wrapper.",
//         },
//         {
//           role: "user",
//           content: code,
//         },
//       ],
//       max_tokens: 500,
//     });

//     const optimizedCode = response.choices[0].message.content.trim();

//     // 🔍 Logs
//     console.log("🔎 Refactor Request Received");
//     console.log("📥 Original Code:\n", code);
//     console.log("✨ Optimized Code Generated:\n", optimizedCode);

//     res.json({ refactoredCode: optimizedCode });
//   } catch (err) {
//     console.error("❌ Error in /api/refactor:", err.response?.data || err.message);
//     res.status(500).json({ error: "Failed to refactor code" });
//   }
// });




// ✅ AI Suggestion (always return JSON object)
// app.post("/api/suggest", async (req, res) => {
//   try {
//     const { code } = req.body;
//     if (!code) return res.status(400).json({ error: "Missing code snippet" });

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content:
//             "You are a code reviewer. Respond ONLY in valid JSON like this:\n" +
//             '{"suggestion": "Current: Time O(?), Space O(?). Suggestion: <one-line improvement>"}\n' +
//             "No extra text, no markdown, only JSON.",
//         },
//         {
//           role: "user",
//           content: code,
//         },
//       ],
//       max_tokens: 100,
//     });

//     const text = response.choices[0].message.content.trim();

//     // Ensure valid JSON response
//     let suggestionObj;
//     try {
//       suggestionObj = JSON.parse(text);
//     } catch (e) {
//       console.error("⚠️ Could not parse AI response, fallback:", text);
//       suggestionObj = { suggestion: text };
//     }

//     console.log("✨ Final Suggestion Object:", suggestionObj);
//     res.json(suggestionObj);
//   } catch (err) {
//     console.error("❌ Error in /api/suggest:", err.response?.data || err.message);
//     res.status(500).json({ error: "Failed to suggest improvements" });
//   }
// });

// ✅ AI Refactor API (analyzes + optimizes, returns only best code)
// ✅ AI Refactor API (analyzes + optimizes, returns only best code)
// app.post("/api/refactor", async (req, res) => {
//   try {
//     const { code } = req.body;
//     if (!code) return res.status(400).json({ error: "Missing code snippet" });

//     // Ask AI to analyze + refactor
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content:
//             "You are a strict code reviewer. First, analyze the given code for its time/space complexity. " +
//             "Then rewrite it in the most efficient way possible. " +
//             "Return ONLY the optimized code. Do not include explanations, markdown, or JSON wrapper.",
//         },
//         {
//           role: "user",
//           content: code,
//         },
//       ],
//       max_tokens: 500,
//     });

//     const optimizedCode = response.choices[0].message.content.trim();

//     // 🔍 Logs
//     console.log("🔎 Refactor Request Received");
//     console.log("📥 Original Code:\n", code);
//     console.log("✨ Optimized Code Generated:\n", optimizedCode);

//     res.json({ refactoredCode: optimizedCode });
//   } catch (err) {
//     console.error("❌ Error in /api/refactor:", err.response?.data || err.message);
//     res.status(500).json({ error: "Failed to refactor code" });
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


// ✅ GitHub Pull: get repo tree + download files locally
app.get("/api/github/pull", async (req, res) => {
  try {
    const { owner, repo, branch = "main" } = req.query;
    if (!owner || !repo) {
      return res.status(400).json({ error: "owner & repo required" });
    }

    // 1. Get branch SHA
    const branchRes = await octokit.repos.getBranch({ owner, repo, branch });
    const treeSha = branchRes.data.commit.commit.tree.sha;

    // 2. Get repo tree
    const treeRes = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: treeSha,
      recursive: "1",
    });

    // 3. Filter for code files (expand if you want all files)
    const files = (treeRes.data.tree || []).filter(
      (item) =>
        item.type === "blob" &&
        /\.(js|jsx|ts|tsx|py|json|md)$/.test(item.path) // ✅ added json/md too
    );

    // 4. Local save directory
    const saveDir = path.join(process.cwd(), "pulled");
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    // 5. Download + save each file
    for (const file of files) {
      const blob = await octokit.git.getBlob({
        owner,
        repo,
        file_sha: file.sha,
      });

      const content = Buffer.from(blob.data.content, "base64").toString("utf-8");

      // Ensure subdirectories exist
      const filePath = path.join(saveDir, file.path);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      fs.writeFileSync(filePath, content, "utf-8");
    }

    console.log(`✅ Pulled ${files.length} files into ${saveDir}`);

    // 6. Return files to frontend (so flowchart UI can render)
    res.json({ files });
  } catch (err) {
    console.error("❌ GitHub Pull Error:", err.message);
    res.status(500).json({ error: "Failed to pull from GitHub" });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "flowchart-ui/public", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});