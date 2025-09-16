// utils/fileparser.js
import fs from "fs";
import * as acorn from "acorn";

/**
 * Extract routes from a single JS file.
 * Returns array of { method, path }
 */
export function extractRoutes(filePath) {
  try {
    const code = fs.readFileSync(filePath, "utf-8");
    let ast;

    try {
      ast = acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" });
    } catch (err) {
      // fallback for CommonJS
      try {
        ast = acorn.parse(code, { ecmaVersion: "latest", sourceType: "script" });
      } catch (err2) {
        console.warn(`⚠️ Skipping ${filePath} (parse error):`, err2.message);
        return [];
      }
    }

    const routes = [];

    walkAst(ast, (node) => {
      if (
        node.type === "CallExpression" &&
        node.callee &&
        node.callee.type === "MemberExpression" &&
        node.callee.object &&
        node.callee.object.name === "app" &&
        node.callee.property &&
        node.callee.property.type === "Identifier"
      ) {
        const method = node.callee.property.name.toLowerCase();
        if (["get", "post", "put", "delete", "patch"].includes(method)) {
          const firstArg = node.arguments?.[0];
          let routePath = null;

          // Literal like "/profile"
          if (firstArg?.type === "Literal" && typeof firstArg.value === "string") {
            routePath = firstArg.value;
          }
          // Template literal without expressions
          else if (
            firstArg?.type === "TemplateLiteral" &&
            firstArg.expressions.length === 0
          ) {
            routePath = firstArg.quasis.map((q) => q.value.cooked).join("");
          }

          // If we got a route path, normalize it
          if (routePath) {
            if (!routePath.startsWith("/")) routePath = "/" + routePath;
            routes.push({ method, path: routePath });
          }
        }
      }
    });

    // Regex fallback if AST fails
    if (routes.length === 0) {
      const regex = /\bapp\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
      let m;
      while ((m = regex.exec(code)) !== null) {
        let pathStr = m[2];
        if (!pathStr.startsWith("/")) pathStr = "/" + pathStr;
        routes.push({ method: m[1], path: pathStr });
      }
    }

    // Deduplicate routes
    const seen = new Set();
    const uniqueRoutes = [];
    for (const r of routes) {
      const key = `${r.method}:${r.path}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRoutes.push(r);
      }
    }

    return uniqueRoutes;
  } catch (err) {
    console.error("❌ extractRoutes error in", filePath, err.message);
    return [];
  }
}

// Recursive AST walker
function walkAst(node, callback) {
  if (!node || typeof node.type !== "string") return;
  callback(node);
  for (const key in node) {
    if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) {
        if (c && typeof c.type === "string") walkAst(c, callback);
      }
    } else if (child && typeof child.type === "string") {
      walkAst(child, callback);
    }
  }
}
