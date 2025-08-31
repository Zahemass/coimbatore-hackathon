// utils/flowGenerator.js
import fs from "fs";
import * as acorn from "acorn";

// Helper: recursive AST walker
function walkAst(node, callback) {
  callback(node);
  for (const key in node) {
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach(
        (child) =>
          child &&
          typeof child.type === "string" &&
          walkAst(child, callback)
      );
    } else if (value && typeof value.type === "string") {
      walkAst(value, callback);
    }
  }
}

// --- add inside flowGenerator.js ---

// Detect parameter usage inside handler code
function extractParamFields(handlerNode, code) {
  const fields = {
    body: [],
    query: [],
    params: []
  };

  walkAst(handlerNode.body, (node) => {
    // Look for destructuring: const { email, password } = req.body;
    if (
      node.type === "VariableDeclarator" &&
      node.id.type === "ObjectPattern" &&
      node.init &&
      node.init.type === "MemberExpression" &&
      node.init.object.name === "req"
    ) {
      const source = node.init.property.name; // body/query/params
      if (fields[source]) {
        node.id.properties.forEach((prop) => {
          if (prop.key?.name) {
            fields[source].push({
              name: prop.key.name,
              required: true, // assume required if destructured
              type: "string"
            });
          }
        });
      }
    }

    // Look for req.body.email style
    if (
      node.type === "MemberExpression" &&
      node.object.type === "MemberExpression" &&
      node.object.object.name === "req"
    ) {
      const source = node.object.property.name; // body/query/params
      const field = node.property.name;
      if (fields[source] && field) {
        if (!fields[source].some(f => f.name === field)) {
          fields[source].push({
            name: field,
            required: false, // accessed, but maybe optional
            type: "string"
          });
        }
      }
    }
  });

  return fields;
}

// Extract routes from Express file
function extractRoutes(filePath) {
  const code = fs.readFileSync(filePath, "utf-8");
  const ast = acorn.parse(code, { ecmaVersion: 2020, sourceType: "module" });

  const routes = [];

  walkAst(ast, (node) => {
    if (
      node.type === "CallExpression" &&
      node.callee.type === "MemberExpression" &&
      node.callee.object.name === "app"
    ) {
      const method = node.callee.property.name; // get/post/put/delete
      if (["get", "post", "put", "delete"].includes(method)) {
        const routePath = node.arguments[0]?.value;
        const handlers = node.arguments.slice(1); // middleware + handler

        const handlerInfos = handlers.map((h) => {
          if (
            h.type === "ArrowFunctionExpression" ||
            h.type === "FunctionExpression"
          ) {
            // Grab the source code for inline handler
            const codeSnippet = code.slice(h.start, h.end);

            // Look for req.body / req.params / req.query usage
            const paramHints = [];
            if (codeSnippet.includes("req.body")) paramHints.push("body");
            if (codeSnippet.includes("req.params")) paramHints.push("params");
            if (codeSnippet.includes("req.query")) paramHints.push("query");

            // Look for res.status / res.json usage
            const responseHints = [];
            if (codeSnippet.includes("res.status")) responseHints.push("status");
            if (codeSnippet.includes("res.json")) responseHints.push("json");
            if (codeSnippet.includes("res.send")) responseHints.push("send");

            return {
              name: "(anonymous function)",
              code: codeSnippet,
              params: paramHints,
              responses: responseHints,
            };
          } else if (h.type === "Identifier") {
            return { name: h.name, code: null, params: [], responses: [] };
          }
          return { name: "unknown", code: null, params: [], responses: [] };
        });

        routes.push({
          method,
          path: routePath,
          handlers: handlerInfos,
        });
      }
    }
  });

  return routes;
}

// Generate flowchart nodes/edges with details
export function generateFlowchartData(filePath) {
  const routes = extractRoutes(filePath);

  const nodes = [];
  const edges = [];

  // Root node (server)
  nodes.push({
    id: "server",
    type: "input",
    data: {
      label: "Express Server",
      description: "Main application entry point",
    },
    position: { x: 250, y: 25 },
  });

  routes.forEach((route, index) => {
    const routeId = `route-${index}`;

    // Route node
    nodes.push({
      id: routeId,
      data: {
        label: `${route.method.toUpperCase()} ${route.path}`,
        description: `Handles ${route.method.toUpperCase()} requests at "${route.path}" with ${route.handlers.length} handler(s)`,
      },
      position: { x: 100 + index * 220, y: 150 },
    });

    edges.push({
      id: `edge-server-${index}`,
      source: "server",
      target: routeId,
      animated: true,
      data: { description: "Express app routes incoming requests here" },
    });

    // Handler nodes
    route.handlers.forEach((handler, hIndex) => {
      const handlerId = `${routeId}-handler-${hIndex}`;
      nodes.push({
        id: handlerId,
        data: {
          label: handler.name,
          description:
            handler.name === "(anonymous function)"
              ? "Inline handler function"
              : `Middleware/handler function "${handler.name}"`,
          code: handler.code,
          params: handler.params,
          responses: handler.responses,
        },
        position: { x: 100 + index * 220, y: 250 + hIndex * 100 },
      });

      edges.push({
        id: `edge-${routeId}-${hIndex}`,
        source: hIndex === 0 ? routeId : `${routeId}-handler-${hIndex - 1}`,
        target: handlerId,
        animated: true,
        data: { description: "Passes request to next middleware/handler" },
      });
    });
  });

  return { nodes, edges };
}
