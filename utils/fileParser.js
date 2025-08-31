import fs from "fs";
import * as acorn from "acorn";


export function extractRoutes(filePath) {
  const code = fs.readFileSync(filePath, "utf-8");
  const ast = acorn.parse(code, { ecmaVersion: 2020, sourceType: "module" });

  const routes = [];

  // Walk the AST to find app.METHOD("path")
  walkAst(ast, (node) => {
    if (
      node.type === "CallExpression" &&
      node.callee.type === "MemberExpression" &&
      node.callee.object.name === "app"
    ) {
      const method = node.callee.property.name; // get/post/put/delete
      if (["get", "post", "put", "delete"].includes(method)) {
        const routePath = node.arguments[0]?.value;
        if (routePath) {
          routes.push({ method, path: routePath });
        }
      }
    }
  });

  return routes;
}

// helper: recursive AST walker
function walkAst(node, callback) {
  callback(node);
  for (const key in node) {
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach((child) => child && typeof child.type === "string" && walkAst(child, callback));
    } else if (value && typeof value.type === "string") {
      walkAst(value, callback);
    }
  }
}
