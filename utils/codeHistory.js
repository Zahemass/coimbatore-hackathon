// filename: utils/codeHistory.js
import fs from "fs";
import path from "path";

const historyDir = path.resolve(".apitester/history");
fs.mkdirSync(historyDir, { recursive: true });

// Save snapshot and overwrite file
export function saveSnapshot(filePath, newCode) {
  const abs = path.resolve(process.cwd(), filePath);
  const historyFile = path.join(historyDir, path.basename(filePath) + ".json");

  // old content before overwrite
  const oldCode = fs.existsSync(abs) ? fs.readFileSync(abs, "utf-8") : "";

  // push old code to history
  let history = [];
  if (fs.existsSync(historyFile)) {
    history = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
  }
  history.push({ timestamp: Date.now(), code: oldCode });
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));

  // overwrite with new code
  fs.writeFileSync(abs, newCode, "utf-8");
  return { success: true };
}

// Undo last change
export function undo(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  const historyFile = path.join(historyDir, path.basename(filePath) + ".json");

  if (!fs.existsSync(historyFile)) return { success: false, msg: "No history" };

  let history = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
  if (history.length === 0) return { success: false, msg: "Nothing to undo" };

  const last = history.pop();
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  fs.writeFileSync(abs, last.code, "utf-8");

  return { success: true, code: last.code };
}

// Simple redo support (optional extension)
export function redo(filePath) {
  return { success: false, msg: "Redo not implemented yet" };
}
