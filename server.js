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