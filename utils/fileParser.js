// utils/fileParser.js
import fs from "fs";
import * as acorn from "acorn";

export function extractRoutes(filePath) {
  try {
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
