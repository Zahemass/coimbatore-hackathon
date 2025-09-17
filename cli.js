// filename: cli.js
import { Command } from "commander";
import { parseInstruction } from "./parser.js";
import { askPort, askTestCases } from "./utils/promptUser.js";
import { detectPort } from "./utils/detectPort.js";
import {
  runApiTests,
  runAutoTests,
  generateTestCases,
  loadTestCasesFromFile,
} from "./tester.js";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { generateFlowchartData } from "./utils/flowGenerator.js";
import {
  generateReactFlowData,
  generateFileFlowData,
} from "./utils/reactFlowGenerator.js";
import { extractRoutes } from "./utils/fileParser.js";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

const program = new Command();

program
  .name("apitester")
  .description("Run natural language API tests, auto-tests, or generate flowcharts")
  .option("--no-prompt", "Do not prompt in CLI; pick default method automatically")
  .option("--method <method>", "Explicit HTTP method to open in GUI (get|post|put|delete|patch)")
  .arguments("<command> [file]")
  .action(async (command, file) => {
    const opts = program.opts();

    // ---------- helpers ----------
    function findAllJsFiles(startDir) {
      const out = [];
      const stack = [startDir];
      const SKIP = new Set([
  "node_modules", ".git", "postman-ui", "flowchart-ui", "dist",
  "sample-react-project", "Reactproject"
]);

      while (stack.length) {
        const dir = stack.pop();
        let list;
        try {
          list = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
          continue;
        }
        for (const d of list) {
          if (d.name.startsWith(".")) continue;
          const full = path.join(dir, d.name);
          if (d.isDirectory()) {
            if (SKIP.has(d.name)) continue;
            stack.push(full);
          } else if (d.isFile() && d.name.endsWith(".js")) out.push(full);
        }
      }
      return out;
    }

    function substitutePathParams(endpoint, env = {}) {
  return endpoint.replace(/:([A-Za-z0-9_]+)/g, (full, key) => {
    // keep placeholder if AI will generate value
    return env[key] || `{${key}}`;
  });
}


    function searchFilesForEndpoint(files, endpoint) {
      const found = [];
      for (const f of files) {
        try {
          const routes = extractRoutes(f);
          const matched = routes.filter((r) => r.path === endpoint);
          if (matched.length) {
            const methods = [...new Set(matched.map((m) => m.method.toLowerCase()))];
            found.push({ file: f, methods });
          }
        } catch {
          // ignore parse errors
        }
      }
      return found;
    }

    function substitutePlaceholders(obj, envMap = {}) {
      if (!obj || typeof obj !== "object") return obj;
      let s = JSON.stringify(obj);
      s = s.replace(/\{([A-Za-z0-9_]+)\}/g, (full, key) => {
        if (Object.prototype.hasOwnProperty.call(envMap, key)) {
          return String(envMap[key]);
        }
        return full;
      });
      try {
        return JSON.parse(s);
      } catch {
        return obj;
      }
    }

    function loadEnvJson() {
      const envPath = path.join(process.cwd(), "env.json");
      try {
        if (fs.existsSync(envPath)) {
          const txt = fs.readFileSync(envPath, "utf-8");
          return JSON.parse(txt);
        }
      } catch {
        // ignore parse error
      }
      return {};
    }

    // ---------- FLOWCHART ----------
    if (command === "flowchart") {
      if (!file) {
        console.error(
          "❌ Please provide a file or directory.\n" +
            "Example:\n" +
            "   node cli.js flowchart sample/index.js\n" +
            "   node cli.js flowchart sample/Reactproject/\n" +
            "   node cli.js flowchart file sample/Reactproject/src/Header.jsx"
        );
        process.exit(1);
      }

      const fullPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ Path not found: ${fullPath}`);
        process.exit(1);
      }

      try {
        let flowData;

        if (file && file.startsWith("file")) {
          const targetFile = process.argv[4];
          if (!targetFile) {
            console.error("❌ Please specify a file path after 'file'");
            process.exit(1);
          }
          const abs = path.resolve(process.cwd(), targetFile);
          console.log(`🔎 Generating file-level flow for ${abs} ...`);
          flowData = generateFileFlowData(abs);
        } else {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            console.log(`🔎 Scanning React project at ${fullPath} ...`);
            flowData = generateReactFlowData(fullPath);
          } else {
            console.log(`🔎 Parsing single file ${fullPath} ...`);
            flowData = generateFileFlowData(fullPath) || generateFlowchartData(fullPath);
          }
        }

        const outputFile = path.resolve("flowchart-ui/src/flowData.json");
        fs.mkdirSync(path.dirname(outputFile), { recursive: true });
        fs.writeFileSync(outputFile, JSON.stringify(flowData, null, 2));
        console.log(`✅ Flowchart data written to ${outputFile}`);

        if (process.env.LAUNCH_UI === "true") {
          try {
            const uiPath = process.env.UI_PATH
              ? path.resolve(process.env.UI_PATH)
              : path.resolve("flowchart-ui");

            const react = spawn("npm", ["start"], {
              cwd: uiPath,
              stdio: "inherit",
              shell: true,
            });

            react.on("close", (code) => {
              console.log(`⚡ Flowchart UI exited with code ${code}`);
            });
          } catch {
            console.error("❌ Failed to start Flowchart UI.");
          }
        }
      } catch (err) {
        console.error("❌ Error generating flowchart:", err.message);
        process.exit(1);
      }
      return;
    }

    // ---------- AUTOTEST ----------
    if (command === "autotest") {
      if (!file) {
        console.error("❌ Provide a file to scan for routes.");
        process.exit(1);
      }
      const fullPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ Path not found: ${fullPath}`);
        process.exit(1);
      }
      try {
        const routes = extractRoutes(fullPath);
        if (routes.length === 0) {
          console.log("⚠️ No routes detected in file.");
          process.exit(0);
        }
        let port = detectPort(file) || (await askPort());
        const numCases = await askTestCases();
        await runAutoTests(routes, port, numCases);
      } catch (err) {
        console.error("❌ Error in autotest:", err.message || err);
        process.exit(1);
      }
      return;
    }

    // ---------- GUI ----------
    if (command === "gui") {
      if (!file) {
        console.error(
          "❌ Provide an instruction. Example: node cli.js gui \"test my profile api in index.js\""
        );
        process.exit(1);
      }
      try {
        const parsed = parseInstruction(file);
        const endpoint =
          parsed.endpoint && parsed.endpoint.startsWith("/")
            ? parsed.endpoint
            : "/" + (parsed.endpoint || "");

        const candidates = [];
        if (parsed.file) {
          const pf = path.resolve(process.cwd(), parsed.file);
          if (fs.existsSync(pf)) candidates.push(pf);
        }

        const common = ["index.js", "api.js", "server.js", "routes.js", "app.js"];
        for (const c of common) {
          const p = path.resolve(process.cwd(), c);
          if (fs.existsSync(p) && !candidates.includes(p)) candidates.push(p);
        }

        const allFiles = findAllJsFiles(process.cwd());
        const prioritized = allFiles.filter(
          (f) =>
            f.includes(`${path.sep}src${path.sep}`) ||
            f.includes(`${path.sep}routes${path.sep}`)
        );
        const searchFiles = [
          ...prioritized,
          ...allFiles.filter((f) => !prioritized.includes(f)),
        ];

        let found = searchFilesForEndpoint(candidates, endpoint);
        if (found.length === 0) found = searchFilesForEndpoint(searchFiles, endpoint);

        let chosenFile = null;
        if (parsed.file && found.length > 0) {
          const targetBasename = path.basename(parsed.file);
          const exact = found.find(
            (f) =>
              path.resolve(f.file) ===
              path.resolve(path.resolve(process.cwd(), parsed.file))
          );
          const byBase = found.find((f) => path.basename(f.file) === targetBasename);
          chosenFile = exact ? exact.file : byBase ? byBase.file : null;
          if (chosenFile) {
            console.log(
              `✅ Auto-selected file from instruction: ${path.relative(
                process.cwd(),
                chosenFile
              )}`
            );
          }
        }

        if (!chosenFile) {
          if (found.length === 1) chosenFile = found[0].file;
          else if (found.length > 1) {
            if (opts.noPrompt) {
              chosenFile = found[0].file;
              console.log(
                `ℹ️ --no-prompt: selected ${path.relative(process.cwd(), chosenFile)}`
              );
            } else {
              const rl = readline.createInterface({ input, output });
              console.log(`ℹ️ Found route ${endpoint} in ${found.length} file(s):`);
              found.forEach((f, idx) => {
                console.log(
                  `  [${idx + 1}] ${path.relative(process.cwd(), f.file)} → methods: ${f.methods.join(
                    ", "
                  ).toUpperCase()}`
                );
              });
              const ans = await rl.question(`Select 1-${found.length} (default 1): `);
              rl.close();
              const idx = parseInt((ans || "1").trim(), 10);
              const pick =
                !Number.isNaN(idx) && idx >= 1 && idx <= found.length ? idx - 1 : 0;
              chosenFile = found[pick].file;
              console.log(
                `✅ Selected: ${path.relative(process.cwd(), chosenFile)}`
              );
            }
          } else {
            const fallback = parsed.file
              ? path.resolve(process.cwd(), parsed.file)
              : path.resolve(process.cwd(), "index.js");
            if (fs.existsSync(fallback)) {
              chosenFile = fallback;
              console.log(
                `ℹ️ Falling back to file: ${path.relative(process.cwd(), chosenFile)}`
              );
            } else {
              console.log(
                `⚠️ No implementation file found for ${endpoint}. GUI will open with parser values only.`
              );
            }
          }
        }

        let presentMethods =
          parsed.methods && parsed.methods.length ? [...parsed.methods] : [];
        if (chosenFile && fs.existsSync(chosenFile)) {
          const routesInChosen = extractRoutes(chosenFile).filter(
            (r) => r.path === endpoint
          );
          if (routesInChosen.length > 0)
            presentMethods = [...new Set(routesInChosen.map((r) => r.method.toLowerCase()))];
        }

        if (opts.method) {
          const m = String(opts.method).toLowerCase();
          if (["get", "post", "put", "delete", "patch"].includes(m)) {
            presentMethods = [m];
            console.log(`✅ Using method from --method: ${m.toUpperCase()}`);
          } else {
            console.warn(`⚠️ --method ${opts.method} not recognized; ignoring.`);
          }
        }

        let chosenMethod = null;
        if (presentMethods.length === 0) {
          chosenMethod =
            parsed.methods && parsed.methods.length ? parsed.methods[0] : "post";
          console.log(
            `⚠️ No methods detected; defaulting to ${chosenMethod.toUpperCase()}`
          );
        } else if (presentMethods.length === 1) {
          chosenMethod = presentMethods[0];
        } else {
          if (opts.noPrompt) {
            chosenMethod = presentMethods.includes("post")
              ? "post"
              : presentMethods[0];
            console.log(
              `ℹ️ --no-prompt: auto-selected ${chosenMethod.toUpperCase()}`
            );
          } else {
            const rl = readline.createInterface({ input, output });
            console.log(
              `The route ${endpoint} supports multiple HTTP methods: ${presentMethods
                .map((m) => m.toUpperCase())
                .join(", ")}`
            );
            const ans = await rl.question(
              `Which method should the GUI open? (${presentMethods.join(", ")}): `
            );
            rl.close();
            const sel = (ans || "").trim().toLowerCase();
            if (presentMethods.includes(sel)) chosenMethod = sel;
            else {
              chosenMethod = presentMethods.includes("post")
                ? "post"
                : presentMethods[0];
              console.log(
                `⚠️ Invalid choice; defaulting to ${chosenMethod.toUpperCase()}`
              );
            }
          }
        }

        const uiPath = process.env.UI_PATH
          ? path.resolve(process.env.UI_PATH)
          : path.resolve("postman-ui");
        const publicDir = path.join(uiPath, "public");
        fs.mkdirSync(publicDir, { recursive: true });

        const chosenFileAbs = chosenFile ? path.resolve(chosenFile) : null;
        let detectedBase = null;
        try {
          if (chosenFileAbs) {
            const p = detectPort(chosenFileAbs);
            if (p) detectedBase = `http://localhost:${p}`;
            console.log(`ℹ️ detectPort(${chosenFileAbs}) => ${p || "(none)"}`);
          } else {
            console.log("ℹ️ No chosenFile to detect port from.");
          }
        } catch (err) {
          console.warn("⚠️ detectPort failed:", err.message || err);
        }

        const envJson = loadEnvJson();

        const guiPrefill = {
          methods: [chosenMethod],
          endpoint: substitutePathParams(endpoint, envJson),
          file: chosenFileAbs,
          instruction: file,
          baseUrl: detectedBase || null,
        };

        let authHeader = null;
        if (process.env.BEARER_TOKEN) {
          authHeader = `Bearer ${process.env.BEARER_TOKEN}`;
        } else if (envJson.BEARER_TOKEN) {
          authHeader = `Bearer ${envJson.BEARER_TOKEN}`;
        }

        if (authHeader) {
          guiPrefill.headers = { Authorization: authHeader };
        } else if (parsed.headers && Object.keys(parsed.headers).length > 0) {
          guiPrefill.headers = parsed.headers;
        }

        if (["post", "put"].includes(chosenMethod)) {
          const endpointKey = endpoint;
          let cases = loadTestCasesFromFile(endpointKey);
          if (!cases || cases.length === 0) {
            console.log(
              `ℹ️ No cached testdata for ${endpointKey}. Generating via OpenAI (if configured)...`
            );
            try {
              let requiredFields = { params: [], query: [], body: [], headers: [] };
if (chosenFile && fs.existsSync(chosenFile)) {
  const routesInChosen = extractRoutes(chosenFile).filter(
    r => r.path === endpoint && r.method.toLowerCase() === chosenMethod
  );
  if (routesInChosen.length > 0) {
    requiredFields = routesInChosen[0].required;
  }
}
console.log("🔎 requiredFields for", endpointKey, requiredFields);

cases = await generateTestCases(endpointKey, requiredFields, 3);
console.log("🧪 AI generated test cases:", cases);


            } catch (err) {
              console.warn("⚠️ generateTestCases failed:", err?.message || err);
              cases = [{ name: "fallback dummy", data: { test: "dummy" } }];
            }
          } else {
            console.log(
              `ℹ️ Loaded ${cases.length} cached test case(s) for ${endpointKey}`
            );
          }

          const mergedEnv = Object.assign({}, envJson);
          Object.keys(process.env).forEach((k) => {
            if (process.env[k] !== undefined && process.env[k] !== "")
              mergedEnv[k] = process.env[k];
          });

          const substitutedCases = cases.map((c) => {
  return {
    name: c.name,
    data: substitutePlaceholders(c.data || {}, mergedEnv),
    params: substitutePlaceholders(c.params || {}, mergedEnv),
    query: substitutePlaceholders(c.query || {}, mergedEnv),
  };
});


          // detect required params from chosen file
let requiredParams = [];
if (chosenFile && fs.existsSync(chosenFile)) {
  const routesInChosen = extractRoutes(chosenFile).filter((r) => r.path === endpoint);
  if (routesInChosen.length > 0) {
    requiredParams = routesInChosen.flatMap((r) => r.required.params || []);
  }
}

// ✅ Trust AI to fill params & body
const enrichedCases = substitutedCases.map((c) => {
  return {
    name: c.name,
    data: c.data || {},
    params: c.params || {},
    query: c.query || {},
  };
});




          try {
            const uiTestdataPath = path.join(publicDir, "testdata.json");
            let uiExisting = {};
            if (fs.existsSync(uiTestdataPath)) {
              try {
                uiExisting = JSON.parse(fs.readFileSync(uiTestdataPath, "utf-8"));
              } catch {}
            }
            uiExisting[endpointKey] = enrichedCases;
            fs.writeFileSync(uiTestdataPath, JSON.stringify(uiExisting, null, 2));
            console.log("✅ wrote substituted test cases to", uiTestdataPath);
          } catch (err) {
            console.warn("⚠️ Failed to write UI testdata:", err.message || err);
          }

          if (enrichedCases.length > 0) {
  guiPrefill.body = JSON.stringify(enrichedCases[0].data, null, 2);
  guiPrefill.params = enrichedCases[0].params;
  guiPrefill.query = enrichedCases[0].query;

  // 🔑 substitute AI params into endpoint
  let endpointFinal = endpoint;
  for (const [k, v] of Object.entries(enrichedCases[0].params || {})) {
    endpointFinal = endpointFinal.replace(`:${k}`, v);
    endpointFinal = endpointFinal.replace(`{${k}}`, v);
  }
  guiPrefill.endpoint = endpointFinal;
}

        }

        try {
          const mergedEnv2 = Object.assign({}, envJson);
          Object.keys(process.env).forEach((k) => {
            if (process.env[k] !== undefined && process.env[k] !== "")
              mergedEnv2[k] = process.env[k];
          });
          if (guiPrefill.body) {
            let parsedBody;
            try {
              parsedBody = JSON.parse(guiPrefill.body);
            } catch {
              parsedBody = null;
            }
            if (parsedBody) {
              const substituted = substitutePlaceholders(parsedBody, mergedEnv2);
              guiPrefill.body = JSON.stringify(substituted, null, 2);
            }
          }
        } catch {}

        try {
          const prefillPath = path.join(publicDir, "gui-prefill.json");
          const toWrite = {
            endpoint: guiPrefill.endpoint,
            methods: guiPrefill.methods,
            file: guiPrefill.file || null,
            instruction: guiPrefill.instruction || null,
            baseUrl: guiPrefill.baseUrl || null,
            body: guiPrefill.body || null,
            params: guiPrefill.params || null,
            query: guiPrefill.query || null,
            headers: guiPrefill.headers || null,
          };
          fs.writeFileSync(prefillPath, JSON.stringify(toWrite, null, 2));
          console.log("✅ wrote prefill to", prefillPath);
          console.log("   -> prefill contents:", JSON.stringify(toWrite, null, 2));
        } catch (err) {
          console.warn("⚠️ Failed to write gui-prefill.json:", err.message || err);
        }

        const serverFile = path.join(uiPath, "server.js");
        if (!fs.existsSync(serverFile))
          console.warn(`⚠️ ${serverFile} not found. Please create postman-ui/server.js.`);
        const serverProc = spawn("node", ["server.js"], {
          cwd: uiPath,
          stdio: "inherit",
          shell: true,
        });

        serverProc.on("error", (err) => {
          console.error("❌ Failed to start GUI server:", err.message || err);
        });
        serverProc.on("close", (code) => {
          console.log(`⚡ GUI server exited with code ${code}`);
        });
      } catch (err) {
        console.error("❌ Error starting GUI:", err.message || err);
        process.exit(1);
      }
      return;
    }

    // ---------- NORMAL API TEST ----------
    try {
      const parsed = parseInstruction(command);
      const port = await askPort();
      const numCases = await askTestCases();
      await runApiTests(parsed, port, numCases);
    } catch (err) {
      console.error("❌ Error running tests:", err.message || err);
      process.exit(1);
    }
  });

program.parse(process.argv);
