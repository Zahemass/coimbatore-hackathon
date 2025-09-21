// filename: cli.js
import { Command } from "commander";
import { parseInstruction } from "./parser.js";
import { askPort, askTestCases } from "./utils/promptUser.js";
import { detectPort } from "./utils/detectPort.js";
import {
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
