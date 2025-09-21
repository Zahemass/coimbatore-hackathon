// filename: utils/codeHistory.js
import fs from "fs";
import path from "path";

const historyDir = path.resolve(".apitester/history");
fs.mkdirSync(historyDir, { recursive: true });
  return { success: true, code: last.code };
}

// Simple redo support (optional extension)
export function redo(filePath) {
  return { success: false, msg: "Redo not implemented yet" };
}
