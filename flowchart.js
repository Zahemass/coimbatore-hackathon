import fs from "fs";
import path from "path";

/**
 * Parse Express routes in a file and output flowchart JSON
 */
export function generateFlowchart(filePath) {
  const absPath = path.resolve(filePath);
  const code = fs.readFileSync(absPath, "utf-8");

  // crude parse: match app.get/app.post...
  const routeRegex = /app\.(get|post|put|delete)\(['"`](.*?)['"`]/g;
  const nodes = [];
  const edges = [];