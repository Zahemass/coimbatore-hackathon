// filename: utils/detectPort.js
import fs from "fs";

export function detectPort(filePath) {
  try {
    const code = fs.readFileSync(filePath, "utf-8");
}
