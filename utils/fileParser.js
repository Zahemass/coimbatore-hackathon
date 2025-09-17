// utils/fileParser.js
import fs from "fs";
import * as acorn from "acorn";

export function extractRoutes(filePath) {
  try {
    const code = fs.readFileSync(filePath, "utf-8");
    let ast;
    try {
      ast = acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" });
    } catch {
      ast = acorn.parse(code, { ecmaVersion: "latest", sourceType: "script" });
    }

    const routes = [];

    walkAst(ast, (node) => {
      if (
        node.type === "CallExpression" &&
        node.callee?.type === "MemberExpression" &&
        node.callee.object?.name === "app"
      ) {
        const method = node.callee.property?.name?.toLowerCase();
        if (!["get", "post", "put", "delete", "patch"].includes(method)) return;

        const pathArg = node.arguments?.[0];
        const handler = node.arguments?.[node.arguments.length - 1];
        let routePath = null;

        if (pathArg?.type === "Literal") routePath = pathArg.value;
        if (
          pathArg?.type === "TemplateLiteral" &&
          pathArg.expressions.length === 0
        ) {
          routePath = pathArg.quasis.map((q) => q.value.cooked).join("");
        }
        if (!routePath) return;
        if (!routePath.startsWith("/")) routePath = "/" + routePath;

        const required = { params: [], query: [], body: [], headers: [] };

        if (handler) {
          walkAst(handler, (inner) => {
            // --- Direct usage: req.body.product ---
            if (
              inner.type === "MemberExpression" &&
              inner.object?.type === "MemberExpression" &&
              inner.object.object?.name === "req"
            ) {
              const target = inner.object.property?.name;
              const key =
                inner.property?.name || inner.property?.value || null;
              if (target && key && required[target]) {
                required[target].push(key);
                console.log(`📌 Direct usage detected: req.${target}.${key}`);
              }
            }

            // --- Destructuring: const { product, qty } = req.body; ---
            if (
              inner.type === "VariableDeclarator" &&
              inner.id.type === "ObjectPattern"
            ) {
              let target = null;

              // Case 1: const { x } = req.body
              if (
                inner.init?.type === "MemberExpression" &&
                inner.init.object?.name === "req"
              ) {
                target = inner.init.property?.name;
              }

              // Case 2: const { x } = req.body || {}
              if (
                inner.init?.type === "LogicalExpression" &&
                inner.init.left?.type === "MemberExpression" &&
                inner.init.left.object?.name === "req"
              ) {
                target = inner.init.left.property?.name;
              }

              // Case 3: const { x } = req.body ?? {}
              if (
                inner.init?.type === "LogicalExpression" &&
                inner.init.operator === "??" &&
                inner.init.left?.type === "MemberExpression" &&
                inner.init.left.object?.name === "req"
              ) {
                target = inner.init.left.property?.name;
              }

              if (target && required[target]) {
                inner.id.properties.forEach((p) => {
                  const field = p.key?.name || p.key?.value;
                  if (field) {
                    required[target].push(field);
                    console.log(
                      `📌 Destructured from req.${target}: ${field}`
                    );
                  }
                });
              }
            }
          });
        }

        // Dedup
        for (const k of Object.keys(required)) {
          required[k] = [...new Set(required[k])];
        }

        console.log(
          `✅ Route parsed: ${method.toUpperCase()} ${routePath} →`,
          required
        );
        routes.push({ method, path: routePath, required });
      }
    });

    return dedupeRoutes(routes, code);
  } catch (err) {
    console.error("❌ extractRoutes error:", err.message);
    return [];
  }
}

function dedupeRoutes(routes, code) {
  if (routes.length === 0) {
    const regex =
      /\bapp\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let m;
    while ((m = regex.exec(code)) !== null) {
      routes.push({
        method: m[1],
        path: m[2].startsWith("/") ? m[2] : "/" + m[2],
        required: { params: [], query: [], body: [], headers: [] },
      });
    }
  }
  const seen = new Set();
  return routes.filter((r) => {
    const key = `${r.method}:${r.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function walkAst(node, cb) {
  if (!node || typeof node.type !== "string") return;
  cb(node);
  for (const key in node) {
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => walkAst(c, cb));
    else if (child && typeof child.type === "string") walkAst(child, cb);
  }
}
