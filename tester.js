// tester.js
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract required fields for each POST endpoint.
 * This maps directly to your index.js routes.
 */
function getRequiredFields(endpoint) {
  switch (endpoint) {
    case "/signup":
      return ["name", "email", "password"];
    case "/login":
      return ["email", "password"];
    case "/profile":
      return ["userId", "bio"];
    case "/settings":
      return ["theme", "notifications"];
    default:
      return []; // let OpenAI infer
  }
}

/**
 * Generate dummy data for POST request using OpenAI.
 */
async function generateDummyData(endpoint, requiredFields = []) {
  try {
    const prompt = `
      You are generating dummy JSON data for testing an Express POST API.
      Endpoint: "${endpoint}"
      Required fields: ${requiredFields.length ? JSON.stringify(requiredFields) : "Unknown"}
      
      - Always include ALL required fields with realistic dummy values.
      - If fields are not provided, infer common ones based on endpoint name.
      - Return ONLY valid JSON (no text, no explanations, no markdown).
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    let responseText = completion.choices[0].message.content.trim();

    // Remove possible markdown blocks (```json ... ```)
    responseText = responseText.replace(/```json|```/g, "").trim();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText }; // fallback
    }

    return data;
  } catch (err) {
    console.error("❌ Error generating dummy data:", err.message);
    return { test: "fallback_dummy" };
  }
}


/**
 * Main API tester
 */
export async function runApiTests(parsed, port) {
  const url = `http://localhost:${port}${parsed.endpoint}`;

  for (const method of parsed.methods) {
    console.log(`\n🚀 Testing ${method.toUpperCase()} ${url}`);

    try {
      let res;

      if (method === "get") {
        res = await axios.get(url);
      } else if (method === "post") {
        const requiredFields = getRequiredFields(parsed.endpoint);
        const dummyData = await generateDummyData(parsed.endpoint, requiredFields);
        console.log("🧪 Sending dummy data:", dummyData);

        res = await axios.post(url, dummyData);
      } else {
        console.log("❌ Unknown method, skipping...");
        continue;
      }

      console.log("✅ Success:", res.status, res.data);
    } catch (err) {
      console.error("❌ Failed:", err.response?.data || err.message);
    }
  }
}
