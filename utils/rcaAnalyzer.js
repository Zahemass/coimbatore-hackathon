// filename: utils/rcaAnalyzer.js
import OpenAI from "openai";
import chalk from "chalk";

// Init OpenAI
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (err) {
    console.warn("⚠️ RCA: Failed to init OpenAI client:", err.message);
  }
} else {
  console.warn("⚠️ RCA: OPENAI_API_KEY not set, RCA disabled.");
}

/**
 * Analyze why a test case failed
 * @param {object} context - contains route info and failure details
 */
export async function analyzeFailure(context) {
  if (!openai) {
    return "RCA disabled (missing OPENAI_API_KEY).";
  }

  const { method, path, params, query, body, error, response } = context;

  const prompt = `
You are analyzing why an API test failed.

Endpoint: [${method.toUpperCase()}] ${path}
Params: ${JSON.stringify(params)}
Query: ${JSON.stringify(query)}
Body: ${JSON.stringify(body)}
Error/Response: ${JSON.stringify(error || response)}

Question: Why might this API request have failed?
Give a short RCA + recommendation in plain English.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const analysis = completion.choices[0].message.content.trim();
    console.log(chalk.cyan("🧭 RCA →"), analysis);
    return analysis;
  } catch (err) {
    console.warn("⚠️ RCA OpenAI error:", err.message);
    return "Could not analyze failure.";
  }
}
