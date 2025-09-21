// filename: utils/reactFlowGenerator.js
import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

const traverse = traverseModule.default;



/**
 * Enhanced React Project Flow Generator
          meta[file].components.push({
            id: `${meta[file].path}::component::${id}`,
            name: id,
            kind: "class",
            start: path.node.start,
            end: path.node.end,
            code: snippetOf(codeSlice(path.node.start, path.node.end), 800),
          });
        }
      },

      JSXElement(path) {
              if (attr.value && attr.value.type === "StringLiteral") props[key] = attr.value.value;
              else if (attr.value && attr.value.type === "JSXExpressionContainer") {
                if (attr.value.expression.type === "JSXElement") {
                  const inner = attr.value.expression.openingElement.name;
                  props[key] = inner.type === "JSXIdentifier" ? inner.name : null;
                } else if (attr.value.expression.type === "Identifier") {
                  props[key] = attr.value.expression.name;
                }
              }
            }
          }
          meta[file].routes.push({ props });
        }

        // usage: capitalized => component usage
        if (/^[A-Z]/.test(elName)) {
          meta[file].uses.push({ name: elName });
        }
      },

      CallExpression(path) {
        const callee = path.node.callee;
        if (callee.type === "Identifier" && callee.name === "useContext") {
          const arg = path.node.arguments[0];
          if (arg && arg.type === "Identifier") {
            meta[file].uses.push({ name: `useContext:${arg.name}` });
          }
        }
        if (callee.type === "Identifier" && /^use[A-Z0-9]/.test(callee.name)) {
          meta[file].uses.push({ name: `hook:${callee.name}` });
        }
      }
    });
  } // end files loop

  // map symbol name -> file path
  const nameToFile = {};
  for (const f of Object.keys(meta)) {
    const info = meta[f];
    for (const c of info.components) nameToFile[c.name] = f;
    for (const h of info.hooks) nameToFile[h.name] = f;
    for (const ctx of info.contexts) nameToFile[ctx.name] = f;
  }

  // build top-level nodes (files)
  const nodes = [];
  const edges = [];
  const filesList = Object.keys(meta).sort();

  filesList.forEach((file, idx) => {
    const column = idx % 5;
    const row = Math.floor(idx / 5);
    nodes.push({
      id: file,
      type: "fileNode",
      position: { x: 150 + column * 320, y: 80 + row * 220 },
      data: {
        label: path.basename(file),
        relPath: meta[file].path,
        summary: [
          meta[file].components.length ? `Components: ${meta[file].components.map(c => c.name).join(", ")}` : null,
          meta[file].hooks.length ? `Hooks: ${meta[file].hooks.map(h => h.name).join(", ")}` : null,
          meta[file].contexts.length ? `Contexts: ${meta[file].contexts.map(c => c.name).join(", ")}` : null,
          meta[file].routes.length ? `Routes: ${meta[file].routes.map(r => JSON.stringify(r.props)).join("; ")}` : null
        ].filter(Boolean).join(" • "),
        symbols: {
          components: meta[file].components,
          hooks: meta[file].hooks,
          contexts: meta[file].contexts,
        },
        uses: meta[file].uses,
        imports: meta[file].imports,
        providers: meta[file].providers,
        routes: meta[file].routes,
        code: snippetOf(meta[file].code, 1200),
      },
    });
  });

  // import edges
  for (const file of filesList) {
    const info = meta[file];
    for (const imp of info.imports) {
      const src = imp.source;
      const resolved = resolveImport(file, src, projectRoot);
      const matched = filesList.find(f => f === resolved || path.relative(process.cwd(), f) === resolved || f.endsWith(resolved));
      if (matched) {
        edges.push({
          id: `imp-${file}-${matched}`,
          source: file,
          target: matched,
          animated: false,
          type: "import",
          data: { raw: src },
        });
      } else {
        const pkgNodeId = `pkg:${src}`;
        if (!nodes.find(n => n.id === pkgNodeId)) {
          nodes.push({
            id: pkgNodeId,
            type: "packageNode",
            position: { x: 20, y: 20 + (nodes.length % 12) * 50 },
            data: { label: src, description: "external package" },
          });
        }
        edges.push({
          id: `imp-${file}-${pkgNodeId}`,
          source: file,
          target: pkgNodeId,
          animated: false,
          type: "import-package",
          data: { raw: src },
        });
      }
    }
  }

  // usage / provider edges
  for (const file of filesList) {
    const info = meta[file];
    for (const u of info.uses) {
      if (u.name && u.name.startsWith("hook:")) {
        const hookName = u.name.replace(/^hook:/, "");
        const impl = nameToFile[hookName];
        if (impl) {
          edges.push({
            id: `hook-${file}-${impl}-${hookName}`,
            source: file,
            target: impl,
            animated: true,
            type: "uses-hook",
            data: { name: hookName },
          });
        }
      } else if (typeof u.name === "string" && u.name.startsWith("useContext:")) {
        const ctx = u.name.replace(/^useContext:/, "");
        const impl = nameToFile[ctx];
        if (impl) {
          edges.push({
            id: `ctx-${file}-${impl}-${ctx}`,
            source: file,
            target: impl,
            animated: true,
            type: "uses-context",
            data: { name: ctx },
          });
        }
      } else {
        const compName = u.name;
        const impl = nameToFile[compName];
        if (impl) {
          edges.push({
            id: `uses-${file}-${impl}-${compName}`,
            source: file,
            target: impl,
            animated: true,
            type: "uses-component",
            data: { name: compName },
          });
        }
      }
    }

    for (const p of info.providers) {
      const ctxName = p.providerFor;
      const impl = nameToFile[ctxName];
      if (impl) {
        edges.push({
          id: `prov-${file}-${impl}-${ctxName}`,
          source: file,
          target: impl,
          animated: false,
          type: "provides-context",
          data: { name: ctxName },
        });
      }
    }
  }

  return { nodes, edges };
}

// If this file is executed directly via Node -> print JSON to stdout
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  try {
    const out = generateReactFlowData(projectPath);
    process.stdout.write(JSON.stringify(out, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

export function generateFileFlowData(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  const code = fs.readFileSync(abs, "utf-8");

  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript", "classProperties", "decorators-legacy"],
  });

  const nodes = [];
  const edges = [];
  let id = 1;

  traverse(ast, {
    FunctionDeclaration(path) {
      const name = path.node.id?.name || `fn-${id}`;
      nodes.push({
        id: `fn-${id}`,
        type: "function",
        data: {
          label: `Function: ${name}`,
          snippet: code.slice(path.node.start, path.node.end),
          description: "Function defined inside this file",
        },
        position: { x: id * 200, y: 100 },
      });
      id++;
    },
    VariableDeclarator(path) {
      const name = path.node.id?.name;
      if (!name) return;

      if (path.node.init?.callee?.name === "useState") {
        nodes.push({
          id: `state-${id}`,
          type: "state",
          data: {
            label: `useState: ${name}`,
            snippet: code.slice(path.node.start, path.node.end),
            description: "React useState hook",
          },
          position: { x: id * 200, y: 200 },
        });
        id++;
      }

      if (
        path.node.init?.type === "ArrowFunctionExpression" ||
        path.node.init?.type === "FunctionExpression"
      ) {
        nodes.push({
          id: `func-${id}`,
          type: "function",
          data: {
            label: `Function: ${name}`,
            snippet: code.slice(path.node.start, path.node.end),
            description: "Arrow/function expression",
          },
          position: { x: id * 200, y: 300 },
        });
        id++;
      }
    },
    ClassDeclaration(path) {
      const name = path.node.id?.name || `Class${id}`;
      nodes.push({
        id: `class-${id}`,
        type: "class",
        data: {
          label: `Class: ${name}`,
          snippet: code.slice(path.node.start, path.node.end),
          description: "Class declaration inside this file",
        },
        position: { x: id * 200, y: 400 },
      });
      id++;
    },
  });

  return { nodes, edges };
}



