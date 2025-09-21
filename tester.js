// filename: tester.js
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { saveReport } from "./utils/reportGenerator.js";
import { extractRoutes } from "./utils/fileParser.js";
import { analyzeFailure } from "./utils/rcaAnalyzer.js";


dotenv.config();

// -------------------- OpenAI init --------------------
const OPENAI_KEY = process.env.OPENAI_API_KEY || null;
let openai = null;
if (OPENAI_KEY) {
  try {
    openai = new OpenAI({ apiKey: OPENAI_KEY });
  } catch (err) {
    console.warn("⚠️ Failed to init OpenAI client:", err.message);
  }
} else {
  console.warn("⚠️ OPENAI_API_KEY not set — OpenAI-based generation disabled.");
}

// -------------------- Utilities --------------------
function loadEnvVariables() {
  const envVars = {};
  try {
    const filePath = path.join(process.cwd(), "env.json");
    if (fs.existsSync(filePath)) {
      Object.assign(envVars, JSON.parse(fs.readFileSync(filePath, "utf-8")));
      console.log(chalk.gray(`ℹ️ Loaded env.json from ${filePath}`));
    }
  } catch {}
  Object.keys(process.env).forEach((k) => {
    if (process.env[k]) envVars[k] = process.env[k];
  });
  if (Object.keys(envVars).length) {
    console.log(chalk.gray(`ℹ️ env vars: ${Object.keys(envVars).join(", ")}`));
  }
  return envVars;
}
          data: ["post", "put", "patch"].includes(route.method) ? payload : undefined,
          headers: envVars.ACCESS_TOKEN ? { Authorization: `Bearer ${envVars.ACCESS_TOKEN}` } : {},
        });
        console.log(chalk.green(`✅ ${route.method.toUpperCase()} Passed → ${testCase.name}`), res.status);
        results.push({
          method: route.method,
          path: route.path,
          params,
          query,
          body: payload,
          case: testCase.name,
          status: res.status,
        });
      } catch (err) {
        console.log("RCA WORKING HERE");
        console.log(chalk.red(`❌ ${route.method.toUpperCase()} Failed → ${testCase.name}`), err.response?.data || err.message);
        
        // RCA hook
const rcaOutput = await analyzeFailure({
  method: route.method,
  path: route.path,
  params,
  query,
  body: payload,
  error: err.response?.data || err.message,
});

results.push({
  method: route.method,
  path: route.path,
  params,
  query,
  body: payload,
  case: testCase.name,
  error: err.message,
  rca: rcaOutput,   // ✅ now GUI can show it
});

      }
    }
  }

  fs.writeFileSync("apitest-results.json", JSON.stringify(results, null, 2));
  console.log(chalk.magenta(`\n📊 Results saved to apitest-results.json`));
  saveReport(results, "json");
  saveReport(results, "csv");
}
