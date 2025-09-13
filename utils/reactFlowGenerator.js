// filename: utils/reactFlowGenerator.js
import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

const traverse = traverseModule.default;



/**
 * Enhanced React Project Flow Generator
 * - Walks a directory (expects src/)
 * - Parses JS/JSX/TS/TSX files with @babel/parser
 * - Detects imports, components, hooks, contexts, providers, routes
 * - Records exact start/end ranges for each symbol (so UI can show exact snippet)
 * - Emits JSON that contains file nodes and per-file symbols for lazy expansion
 *
 * Usage:
 *   node ./utils/reactFlowGenerator.js ./path/to/project > flow-data.json
 * or via npm script included later
 */

// ---------- utils ----------


function generateFileFlowchart(filePath, code) {
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx"],
  });

  const nodes = [];
  const edges = [];
  let id = 1;

  traverse(ast, {
    FunctionDeclaration(path) {
      nodes.push({
        id: `fn-${id}`,
        type: "function",
        data: {
          label: `Function: ${path.node.id.name}`,
          snippet: code.slice(path.node.start, path.node.end),
          description: "User-defined function inside file",
        },
        position: { x: id * 150, y: 100 },
      });
      id++;
    },
    VariableDeclarator(path) {
      if (path.node.init?.callee?.name === "useState") {
        nodes.push({
          id: `state-${id}`,
          type: "state",
          data: {
            label: `State: ${path.node.id.name}`,
            snippet: code.slice(path.node.start, path.node.end),
            description: "React useState hook",
          },
          position: { x: id * 150, y: 200 },
        });
        id++;
      }
    },
    ClassDeclaration(path) {
      nodes.push({
        id: `class-${id}`,
        type: "class",
        data: {
          label: `Class: ${path.node.id.name}`,
          snippet: code.slice(path.node.start, path.node.end),
          description: "Class component or utility class",
        },
        position: { x: id * 150, y: 300 },
      });
      id++;
    },
  });

  return { nodes, edges };
}

function walkDir(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".") || entry.name === "build") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, files);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function resolveImport(fromFile, importSource, projectRoot) {
  if (!importSource.startsWith(".") && !importSource.startsWith("/")) return importSource;
  const base = path.dirname(fromFile);
  const candidates = [
    path.resolve(base, importSource),
    path.resolve(base, importSource + ".js"),
    path.resolve(base, importSource + ".jsx"),
    path.resolve(base, importSource + ".ts"),
    path.resolve(base, importSource + ".tsx"),
    path.resolve(base, importSource, "index.js"),
    path.resolve(base, importSource, "index.jsx"),
    path.resolve(projectRoot, importSource),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return path.relative(process.cwd(), c);
  }
  return importSource;
}

function snippetOf(str, len = 420) {
  if (!str) return "";
  let s = str.trim();
  if (s.length > len) s = s.slice(0, len) + "…";
  return s;
}

// ---------- main generator ----------
export function generateReactFlowData(projectPath) {
  const abs = path.resolve(projectPath);
  if (!fs.existsSync(abs)) throw new Error(`Path not found: ${abs}`);

  const srcDir = fs.existsSync(path.join(abs, "src")) ? path.join(abs, "src") : abs;
  const files = walkDir(srcDir);

  const meta = {}; // filePath -> metadata
  const projectRoot = process.cwd();

  for (const file of files) {
    const code = fs.readFileSync(file, "utf-8");
    let ast;
    try {
      ast = parse(code, {
        sourceType: "module",
        plugins: ["jsx", "typescript", "classProperties", "decorators-legacy", "optionalChaining", "nullishCoalescingOperator"],
      });
    } catch (err) {
      console.warn(`⚠️  Parse failed for ${file}: ${err.message}`);
      meta[file] = {
        path: path.relative(process.cwd(), file),
        imports: [],
        components: [],
        hooks: [],
        contexts: [],
        uses: [],
        providers: [],
        routes: [],
        code,
      };
      continue;
    }

    meta[file] = {
      path: path.relative(process.cwd(), file),
      imports: [],
      components: [],
      hooks: [],
      contexts: [],
      uses: [],
      providers: [],
      routes: [],
      code,
    };

    // map local name -> import source
    const importMap = {};

    // First pass: imports & export info
    traverse(ast, {
      ImportDeclaration(path) {
        const src = path.node.source.value;
        const specifiers = path.node.specifiers.map(s => {
          const local = s.local?.name;
          const imported = s.type === "ImportSpecifier" ? s.imported?.name : (s.type === "ImportDefaultSpecifier" ? "default" : "*");
          if (local) importMap[local] = src;
          return { local, imported };
        });
        meta[file].imports.push({ source: src, specifiers });
      },
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          // collect names
          if (path.node.declaration.declarations) {
            for (const d of path.node.declaration.declarations) {
              if (d.id && d.id.name) { /* could record exported names if needed */ }
            }
          } else if (path.node.declaration.id && path.node.declaration.id.name) { /*...*/ }
        }
      },
      ExportDefaultDeclaration() {
        meta[file].hasDefaultExport = true;
      }
    });

    // helper to collect code slice given node start,end
    function codeSlice(start, end) {
      try {
        return code.slice(start, end);
      } catch {
        return "";
      }
    }

    // Second pass: components/hooks/context/uses
    traverse(ast, {
      FunctionDeclaration(path) {
        const node = path.node;
        const name = node.id?.name;
        if (!name) return;

        // detect component: uppercase name + contains JSX
        let containsJSX = false;
        path.traverse({ JSXElement() { containsJSX = true; }, JSXFragment() { containsJSX = true; }});
        if (containsJSX && /^[A-Z]/.test(name)) {
          meta[file].components.push({
            id: `${meta[file].path}::component::${name}`,
            name,
            kind: "function",
            start: node.start,
            end: node.end,
            code: snippetOf(codeSlice(node.start, node.end), 800),
          });
        }

        if (/^use[A-Z0-9]/.test(name)) {
          meta[file].hooks.push({
            id: `${meta[file].path}::hook::${name}`,
            name,
            start: node.start,
            end: node.end,
            code: snippetOf(codeSlice(node.start, node.end), 800),
          });
        }
      },

      VariableDeclarator(path) {
        const id = path.node.id;
        const init = path.node.init;
        if (!id || !init) return;
        // variable name
        const name = id.name || (id.type === "Identifier" ? id.name : null);

        if (name && (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression")) {
          let containsJSX = false;
          path.traverse({ JSXElement() { containsJSX = true; }, JSXFragment() { containsJSX = true; }});
          if (containsJSX && /^[A-Z]/.test(name)) {
            meta[file].components.push({
              id: `${meta[file].path}::component::${name}`,
              name,
              kind: "function",
              start: init.start,
              end: init.end,
              code: snippetOf(codeSlice(init.start, init.end), 800),
            });
          }
          if (/^use[A-Z0-9]/.test(name)) {
            meta[file].hooks.push({
              id: `${meta[file].path}::hook::${name}`,
              name,
              start: init.start,
              end: init.end,
              code: snippetOf(codeSlice(init.start, init.end), 800),
            });
          }
        }

        // detect createContext
        if (init && init.type === "CallExpression") {
          const callee = init.callee;
          let isCreateContext = false;
          if (callee.type === "MemberExpression" && callee.object.name === "React" && callee.property.name === "createContext") isCreateContext = true;
          if (callee.type === "Identifier" && callee.name === "createContext") isCreateContext = true;
          if (isCreateContext && id.type === "Identifier") {
            meta[file].contexts.push({
              id: `${meta[file].path}::context::${id.name}`,
              name: id.name,
              start: path.node.start,
              end: path.node.end,
              code: snippetOf(codeSlice(path.node.start, path.node.end), 800),
            });
          }
        }
      },

      ClassDeclaration(path) {
        const id = path.node.id?.name;
        if (!id) return;
        const sc = path.node.superClass;
        if (sc && ((sc.type === "MemberExpression" && sc.object.name === "React" && sc.property.name === "Component") || (sc.type === "Identifier" && sc.name === "Component"))) {
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
        const opening = path.node.openingElement;
        let elName = null;
        if (opening.name.type === "JSXIdentifier") elName = opening.name.name;
        else if (opening.name.type === "JSXMemberExpression") {
          const object = opening.name.object.name;
          const prop = opening.name.property.name;
          elName = `${object}.${prop}`;
        }
        if (!elName) return;

        // provider heuristics
        if (elName.includes(".Provider")) {
          const ctxName = elName.split(".")[0];
          meta[file].providers.push({ providerFor: ctxName, element: elName });
        }

        // route detection (Route)
        if (elName === "Route") {
          const props = {};
          for (const attr of opening.attributes || []) {
            if (attr.type === "JSXAttribute" && attr.name && attr.name.name) {
              const key = attr.name.name;
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



