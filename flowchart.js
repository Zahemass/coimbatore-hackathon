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
  let match;
  let id = 1;

  while ((match = routeRegex.exec(code)) !== null) {
    const method = match[1].toUpperCase();
    const route = match[2];

    nodes.push({ id: `${id}`, data: { label: `${method} ${route}` }, position: { x: 100, y: id * 100 } });
    if (id > 1) {
      edges.push({ id: `e${id-1}-${id}`, source: `${id-1}`, target: `${id}` });
    }
    id++;
  }

  return { nodes, edges };
}
