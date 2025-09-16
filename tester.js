// filename: tester.js
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { saveReport } from "./utils/reportGenerator.js";

dotenv.config();

// Try to initialise OpenAI client only if API key is present.
// If missing, we keep openai = null and continue (non-fatal).
const OPENAI_KEY = process.env.OPENAI_API_KEY || null;
let openai = null;

if (OPENAI_KEY) {
  try {
    openai = new OpenAI({ apiKey: OPENAI_KEY });
  } catch (err) {
    console.warn("⚠️ Failed to init OpenAI client:", err.message);
    openai = null;
  }
} else {
  console.warn("⚠️ OPENAI_API_KEY not set — OpenAI-based generation will be disabled.");
}

/**
 * Robust load environment variables (from env.json and process.env)
 * - Looks for env.json in the current working directory (process.cwd()).
 * - Merges with process.env (process.env overrides file values).
 * - Returns an object map of available env variables.
 */
function loadEnvVariables() {
  const envVars = {};

  // 1) Try env.json in current working directory (where CLI is invoked)
  try {
    const filePath = path.join(process.cwd(), "env.json");
    if (fs.existsSync(filePath)) {
      const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      Object.assign(envVars, fileData);
      console.log(chalk.gray(`ℹ️ Loaded env.json from ${filePath}`));
    } else {
      // no env.json found in cwd
      // console.log(chalk.gray(`ℹ️ env.json not found at ${filePath}`));
    }
  } catch (err) {
    console.warn("⚠️ Failed to load env.json:", err.message);
  }

  // 2) Overlay process.env (so shell-provided vars override file)
  Object.keys(process.env).forEach((k) => {
    const v = process.env[k];
    if (v !== undefined && v !== "") envVars[k] = v;
  });

  const keys = Object.keys(envVars);
  if (keys.length) {
    console.log(chalk.gray(`ℹ️ env variables available: ${keys.join(", ")}`));
  } else {
    console.log(chalk.gray("ℹ️ No env variables found (env.json missing and none in process.env)."));
  }

  return envVars;
}

/**
 * Substitute placeholders in the shape {KEY} inside a JSON-like object.
 * - Works by stringifying the object, replacing {KEY} tokens, and parsing back.
 * - Falls back safely and logs missing keys.
 */
function substituteEnvVars(data, envVars = {}) {
  if (!data || typeof data !== "object") return data;

  // Merge envVars with process.env as fallback (process.env doesn't overwrite provided envVars)
  const merged = Object.assign({}, envVars);
  Object.keys(process.env).forEach((k) => {
    if (merged[k] === undefined) merged[k] = process.env[k];
  });

  let str = JSON.stringify(data);

  const missing = new Set();
  // Replace placeholders like {USER_ID}
  str = str.replace(/\{([A-Za-z0-9_]+)\}/g, (full, key) => {
    if (Object.prototype.hasOwnProperty.call(merged, key)) {
      // convert everything to string in replacement (JSON.parse will convert types back where appropriate)
      return String(merged[key]);
    } else {
      missing.add(key);
      return full; // keep placeholder as-is so we can see it in logs
    }
  });

  if (missing.size) {
    console.warn(chalk.yellow(`⚠️ Missing env values for: ${Array.from(missing).join(", ")}`));
  }

  try {
    return JSON.parse(str);
  } catch (err) {
    console.warn("⚠️ substituteEnvVars: JSON parse failed after substitution:", err.message);
    // return original object as fallback
    return data;
  }
}

/**
 * Load test cases from testdata.json (if exists) - repo root
 */
export function loadTestCasesFromFile(endpoint) {
  try {
    const filePath = path.join(process.cwd(), "testdata.json");
    if (fs.existsSync(filePath)) {
      const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return json[endpoint] || null;
    }
  } catch (err) {
    console.error("⚠️ Failed to load testdata.json:", err.message);
  }
  return null;
}

/**
 * Generate test cases with OpenAI if available.
 * If OpenAI is not configured, fall back to local testdata.json or a dummy set.
 */
export async function generateTestCases(endpoint, requiredFields = [], numCases = 5) {
  // try local cache first
  const cached = loadTestCasesFromFile(endpoint);
  if (cached && cached.length > 0) {
    console.log(chalk.blue(`📂 Using cached testdata.json for ${endpoint}`));
    return cached.slice(0, numCases);
  }

  if (!openai) {
    console.warn("⚠️ OpenAI API key not configured — returning fallback dummy test cases.");
    const fallback = [{ name: "fallback dummy", data: { test: "dummy" } }];
    try {
      const filePath = path.join(process.cwd(), "testdata.json");
      let existing = {};
      if (fs.existsSync(filePath)) {
        existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
      existing[endpoint] = fallback;
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
      console.log(chalk.blue(`📂 Wrote fallback testdata.json for ${endpoint}`));
    } catch (err) {
      console.warn("⚠️ Could not write fallback testdata.json:", err.message);
    }
    return fallback.slice(0, numCases);
  }

  // OpenAI is available — call it
  try {
    const prompt = `
      You are generating API test cases for an Express API endpoint.

      Endpoint: "${endpoint}"
      Required fields: ${requiredFields.length ? JSON.stringify(requiredFields) : "Unknown"}
      Number of test cases: ${numCases}

      Rules:
      - Always include at least 1 valid test case with correct data.
      - The rest should be invalid or edge cases (missing fields, invalid formats, weak passwords, etc).
      - Each test case must be an object:
        { "name": "short description", "data": { ...requestBody } }
      - Return ONLY a JSON array of objects, no markdown or explanation.
    `;

    // 🔹 Log what we send
    console.log(chalk.yellow("\n🛰️ Sent to OpenAI prompt:\n"), prompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    // 🔹 Log raw response
    const rawResponse = completion.choices[0].message.content;
    console.log(chalk.cyan("\n📡 Raw response from OpenAI:\n"), rawResponse);

    let responseText = rawResponse.trim();
    responseText = responseText.replace(/```json|```/g, "").trim();

    let data;
    try {
      data = JSON.parse(responseText);

      // 🔹 Log parsed JSON
      console.log(chalk.green("\n✅ Parsed JSON test cases:"), data);
    } catch (parseErr) {
      console.warn("⚠️ OpenAI returned non-JSON or unparsable output — using fallback.", parseErr.message);
      data = [{ name: "fallback dummy", data: { test: "dummy" } }];
    }

    try {
      const filePath = path.join(process.cwd(), "testdata.json");
      let existing = {};
      if (fs.existsSync(filePath)) {
        existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
      existing[endpoint] = data;
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
      console.log(chalk.blue(`📂 Auto-generated test cases saved to testdata.json`));
    } catch (err) {
      console.warn("⚠️ Failed to save generated testdata.json:", err.message);
    }

    return data.slice(0, numCases);
  } catch (err) {
    console.error("❌ Error generating test cases via OpenAI:", err.message || err);
    return [{ name: "fallback dummy", data: { test: "dummy" } }];
  }
}


/**
 * Run API tests (normal mode)
 */
export async function runApiTests(parsed, port, numCases = 5) {
  const url = `http://localhost:${port}${parsed.endpoint}`;
  const envVars = loadEnvVariables();
  const results = [];

  for (const method of parsed.methods) {
    console.log(`\n🚀 Testing ${method.toUpperCase()} ${url}`);

    if (method === "get") {
  try {
    // If envVars has ACCESS_TOKEN, use it as Bearer header for GET
    const headers = {};
    if (envVars && envVars.ACCESS_TOKEN) {
      headers["Authorization"] = `Bearer ${envVars.ACCESS_TOKEN}`;
      console.log(chalk.gray(`ℹ️ Sending Authorization header for GET (masked): ${String(envVars.ACCESS_TOKEN).slice(0,3)}…`));
    }
    const res = await axios.get(url, { headers });
    console.log(chalk.green("✅ GET Success:"), res.status, res.data);
    results.push({ method, path: parsed.endpoint, case: "GET", status: res.status });
  } catch (err) {
    console.log(chalk.red("❌ GET Failed"), err.response?.data || err.message);
    results.push({ method, path: parsed.endpoint, case: "GET", error: err.response?.data || err.message });
  }
  continue;
}


    if (["post", "put", "delete"].includes(method)) {
      // Load from testdata.json first
      let testCases = loadTestCasesFromFile(parsed.endpoint);

      if (!testCases) {
        console.log(chalk.yellow("⚠️ No local testdata.json found. Generating dummy test cases..."));
        testCases = await generateTestCases(parsed.endpoint, [], numCases);
      }

      for (const [index, testCase] of testCases.entries()) {
        const label = `Test Case ${index + 1}: ${testCase.name}`;

        
        const payload = substituteEnvVars(testCase.data, envVars);

        console.log(`\n⚡ ${label}`);
        console.log("Payload:", payload);

        try {
          const res = await axios({ method, url, data: payload });
          console.log(chalk.green(`✅ Passed → ${label}`), res.status, res.data);

          results.push({ method, path: parsed.endpoint, case: label, payload, status: res.status });
        } catch (err) {
          console.log(`❌ Failed → ${label}`, err.response?.data || err.message);
          results.push({
            method,
            path: parsed.endpoint,
            case: label,
            payload,
            error: err.response?.data || err.message,
          });
        }
      }
    }
  }

  fs.writeFileSync("apitest-results.json", JSON.stringify(results, null, 2));
  console.log(chalk.magenta(`\n📊 Results saved to apitest-results.json`));

  saveReport(results, "json");
  saveReport(results, "csv");
}

/**
 * Run auto-tests for all detected routes
 */
export async function runAutoTests(routes, port, numCases = 5) {
  const envVars = loadEnvVariables();
  console.log(chalk.yellow(`\n🚀 Running auto-tests for ${routes.length} routes...`));
  const results = [];

  for (const route of routes) {
    const url = `http://localhost:${port}${route.path}`;
    console.log(chalk.cyan(`\n⚡ Testing ${route.method.toUpperCase()} ${url}`));

    if (route.method === "get") {
      try {
        const res = await axios.get(url);
        console.log(chalk.green(`✅ GET ${route.path} → ${res.status}`));
        results.push({ method: "get", path: route.path, case: "GET", status: res.status });
      } catch (err) {
        console.log(chalk.red(`❌ GET ${route.path} failed`), err.response?.data || err.message);
        results.push({ method: "get", path: route.path, case: "GET", error: err.response?.data || err.message });
      }
      continue;
    }

    if (["post", "put", "delete"].includes(route.method)) {
      let testCases = loadTestCasesFromFile(route.path);

      if (!testCases) {
        console.log(chalk.yellow(`⚠️ No local testdata.json for ${route.path}. Generating dummy test cases...`));
        testCases = await generateTestCases(route.path, [], numCases);
      }

      for (const [index, testCase] of testCases.entries()) {
        const label = `Test Case ${index + 1}: ${testCase.name}`;

        
        const payload = substituteEnvVars(testCase.data, envVars);

        console.log(`\n⚡ ${label}`);
        console.log("Payload:", payload);

        try {
          const res = await axios({ method: route.method, url, data: payload });
          console.log(chalk.green(`✅ ${route.method.toUpperCase()} ${route.path} (${label}) → ${res.status}`));

          results.push({ method: route.method, path: route.path, case: label, payload, status: res.status });
        } catch (err) {
          console.log(chalk.red(`❌ ${route.method.toUpperCase()} ${route.path} (${label}) failed`), err.response?.data || err.message);

          results.push({ method: route.method, path: route.path, case: label, payload, error: err.response?.data || err.message });
        }
      }
    }
  }

  fs.writeFileSync("apitest-results.json", JSON.stringify(results, null, 2));
  console.log(chalk.magenta(`\n📊 Results saved to apitest-results.json`));

  saveReport(results, "json");
  saveReport(results, "csv");
}
