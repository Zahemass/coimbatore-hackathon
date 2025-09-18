// filename: utils/rcaAnalyzer.js
import OpenAI from "openai";
import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config();

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
You are analyzing an API failure. 
Keep your response **short, suggestive, and not 100% certain**.

Endpoint: [${method.toUpperCase()}] ${path}
Params: ${JSON.stringify(params)}
Query: ${JSON.stringify(query)}
Body: ${JSON.stringify(body)}
Error: ${JSON.stringify(error || response)}

Rules for the answer:
- Use language like "maybe", "likely", or "could be" instead of absolute statements.
- Point out which field(s) might be missing or invalid.
- Suggest that it could be required in the code.
- Include that check the code of api which you written. 
- Provide a minimal JSON example showing the possible fix.
- Keep it short (2–3 lines).
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2, // softer, less deterministic
      max_tokens: 120,  // force brevity
    });

    const analysis = completion.choices[0].message.content.trim();
    console.log(chalk.cyan("🧭 RCA →"), analysis);
    return analysis;
  } catch (err) {
    console.warn("⚠️ RCA OpenAI error:", err.message);
    return "Could not analyze failure.";
  }
}
