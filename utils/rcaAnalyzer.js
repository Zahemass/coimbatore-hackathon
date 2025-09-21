// filename: utils/rcaAnalyzer.js
import OpenAI from "openai";
import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config();

// Init OpenAI
let openai = null;
if (process.env.OPENAI_API_KEY) {
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
