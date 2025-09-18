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

function substituteEnvVars(data, envVars = {}) {
  if (!data || typeof data !== "object") return data;
  let str = JSON.stringify(data);
  str = str.replace(/\{([A-Za-z0-9_]+)\}/g, (full, key) =>
    envVars[key] !== undefined ? String(envVars[key]) : full
  );
  try {
    return JSON.parse(str);
  } catch {
    return data;
  }
}

function buildUrlWithQuery(baseUrl, queryObj = {}) {
  const qs = new URLSearchParams(queryObj).toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

// -------------------- Payload Sanitizer --------------------
function sanitizePayload(data) {
  if (!data || typeof data !== "object") return data;
  const clean = { ...data };
  delete clean.method;
  delete clean.endpoint;
  delete clean.expected_status;
  delete clean.expected_response;
  return clean;
}

// -------------------- Test case utils --------------------
export function loadTestCasesFromFile(endpoint) {
  try {
    const filePath = path.join(process.cwd(), "testdata.json");
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"))[endpoint] || null;
    }
  } catch {}
  return null;
}

async function generateWithOpenAI(endpoint, requiredFields = {}, numCases = 3) {
  if (!openai) {
    return Array.from({ length: numCases }, (_, i) => ({
      name: `fallback ${i + 1}`,
      params: {},
      query: {},
      data: { dummy: i + 1 },
    }));
  }

  const prompt = `
Generate ${numCases} API test cases for endpoint "${endpoint}".
The endpoint may have:
- URL params: ${JSON.stringify(requiredFields.params || [])}
- Query params: ${JSON.stringify(requiredFields.query || [])}
- Body fields: ${JSON.stringify(requiredFields.body || [])}

Rules:
- Always output an array of objects.
- Each object must be shaped like:
  {
    "name": "Valid case ...",
    "params": { ... },
    "query": { ... },
    "data": { ... }
  }
- "params" = URL placeholder values (empty {} if none)
- "query" = query string fields (empty {} if none)
- "data" = request body (empty {} if none)
- Include at least 1 valid case and several invalid/edge cases.
- Do NOT include keys like method, endpoint, expected_status, expected_response.
`;

  console.log(chalk.yellow("\n🛰️ OpenAI prompt:\n"), prompt);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });
    const raw = completion.choices[0].message.content.trim();
    const cleaned = raw
      .replace(/```json|```/g, "")
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");
    return JSON.parse(cleaned.trim());
  } catch (err) {
    console.error("❌ OpenAI error:", err.message);
    return [
      { name: "fallback", params: {}, query: {}, data: { test: "dummy" } },
    ];
  }
}

export async function generateTestCases(endpoint, requiredFields = { params: [], query: [], body: [] }, numCases = 2) {
  let cached = loadTestCasesFromFile(endpoint);
  if (cached && cached.length >= numCases) return cached.slice(0, numCases);

  if (cached && cached.length < numCases) {
    const extra = await generateWithOpenAI(endpoint, requiredFields, numCases - cached.length);
    cached = [...cached, ...extra];
  }
  if (!cached) {
    cached = await generateWithOpenAI(endpoint, requiredFields, numCases);
  }

  try {
    const filePath = path.join(process.cwd(), "testdata.json");
    let existing = {};
    if (fs.existsSync(filePath)) {
      existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    existing[endpoint] = cached;
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  } catch {}

  return cached.slice(0, numCases);
}

// -------------------- Test runners --------------------
export async function runApiTests(parsed, port, numCases = 5) {
  const envVars = loadEnvVariables();
  const allRoutes = extractRoutes(path.join(process.cwd(), "sample/index.js"));
  const endpoint = parsed.endpoint;

  const matched = allRoutes.find((r) => r.path === endpoint);
  const required = matched?.required || { params: [], query: [], body: [] };

  const testCases = await generateTestCases(endpoint, required, numCases);
  const results = [];

  for (const method of parsed.methods) {
    for (const [i, testCase] of testCases.entries()) {
      const params = substituteEnvVars(testCase.params || {}, envVars);
      const query = substituteEnvVars(testCase.query || {}, envVars);
      let payload = substituteEnvVars(testCase.data || {}, envVars);
      payload = sanitizePayload(payload);

      // substitute params in URL
      let url = endpoint;
      for (const [k, v] of Object.entries(params)) {
        url = url.replace(`:${k}`, encodeURIComponent(v));
      }

      const fullUrl = `http://localhost:${port}${url}`;
      const urlWithQuery = buildUrlWithQuery(fullUrl, query);

      console.log(`\n🚀 Testing ${method.toUpperCase()} ${urlWithQuery}`);
      console.log(`⚡ Case ${i + 1}: ${testCase.name}`);
      if (Object.keys(payload).length) console.log("Payload:", payload);

      try {
        const res = await axios({
          method,
          url: urlWithQuery,
          data: ["post", "put", "patch"].includes(method) ? payload : undefined,
          headers: envVars.ACCESS_TOKEN ? { Authorization: `Bearer ${envVars.ACCESS_TOKEN}` } : {},
        });
        console.log(chalk.green(`✅ Passed → ${testCase.name}`), res.status);
         
        results.push({
          method,
          path: endpoint,
          params,
          query,
          body: payload,
          case: testCase.name,
          status: res.status,
        });
      } catch (err) {
        console.log("RCA WORKING HERE");     
        console.log(chalk.red(`❌ Failed → ${testCase.name}`), err.response?.data || err.message);
        // RCA hook
  const rcaOutput = await analyzeFailure({
  method,
  path: endpoint,
  params,
  query,
  body: payload,
  error: err.response?.data || err.message,
});

        results.push({
          method,
          path: endpoint,
          params,
          query,
          body: payload,
          case: testCase.name,
          error: err.message,
          rca: rcaOutput, 
        });
      }
    }
  }

  fs.writeFileSync("apitest-results.json", JSON.stringify(results, null, 2));
  saveReport(results, "json");
  saveReport(results, "csv");
}

// -------------------- Auto testing all routes --------------------
export async function runAutoTests(routes, port, numCases = 5) {
  const envVars = loadEnvVariables();
  console.log(chalk.yellow(`\n🚀 Running auto-tests for ${routes.length} routes...`));
  const results = [];

  for (const route of routes) {
    const required = route.required || { params: [], query: [], body: [] };
    const testCases = await generateTestCases(route.path, required, numCases);

    for (const [i, testCase] of testCases.entries()) {
      const params = substituteEnvVars(testCase.params || {}, envVars);
      const query = substituteEnvVars(testCase.query || {}, envVars);
      let payload = substituteEnvVars(testCase.data || {}, envVars);
      payload = sanitizePayload(payload);

      let url = route.path;
      for (const [k, v] of Object.entries(params)) {
        url = url.replace(`:${k}`, encodeURIComponent(v));
      }

      const fullUrl = `http://localhost:${port}${url}`;
      const urlWithQuery = buildUrlWithQuery(fullUrl, query);

      console.log(`\n⚡ ${route.method.toUpperCase()} Case ${i + 1}: ${testCase.name}`);
      if (Object.keys(payload).length) console.log("Payload:", payload);

      try {
        const res = await axios({
          method: route.method,
          url: urlWithQuery,
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
