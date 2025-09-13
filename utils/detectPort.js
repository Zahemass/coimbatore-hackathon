// filename: utils/detectPort.js
import fs from "fs";

export function detectPort(filePath) {
  try {
    const code = fs.readFileSync(filePath, "utf-8");
    const match = code.match(/listen\s*\(\s*(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
  } catch (err) {
    console.error("⚠️ Port detection failed:", err.message);
  }
  return null; // fallback to manual input
}
