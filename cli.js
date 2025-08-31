#!/usr/bin/env node
import { Command } from "commander";
import { parseInstruction } from "./parser.js";
import { askPort } from "./utils/promptUser.js";
import { runApiTests } from "./tester.js";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { generateFlowchartData } from "./utils/flowGenerator.js";

const program = new Command();

program
  .name("apitester")
  .description("Run natural language API tests or generate flowcharts")
  .arguments("<command> [file]")
  .action(async (command, file) => {
    if (command === "flowchart") {
      if (!file) {
        console.error("❌ Please provide a file. Example: node cli.js flowchart sample/index.js");
        process.exit(1);
      }

      const fullPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ File not found: ${fullPath}`);
        process.exit(1);
      }

      // inside flowchart command
try {
  const flowData = generateFlowchartData(fullPath);

  // Write to a fixed file so React UI can always load it
  const outputFile = path.resolve("flowchart-ui/src/flowData.json");
  fs.writeFileSync(outputFile, JSON.stringify(flowData, null, 2));
  console.log(`✅ Flowchart data written. Launching UI...`);

  // Launch React UI
  const uiPath = path.resolve("flowchart-ui");
  const react = spawn("npm", ["start"], {
    cwd: uiPath,
    stdio: "inherit",
    shell: true,
  });

  react.on("close", (code) => {
    console.log(`⚡ Flowchart UI exited with code ${code}`);
  });
} catch (err) {
  console.error("❌ Error generating flowchart:", err.message);
  process.exit(1);
}


      return;
    }

    // API test command
    try {
      const parsed = parseInstruction(command);
      const port = await askPort();
      await runApiTests(parsed, port);
    } catch (err) {
      console.error("❌ Error running tests:", err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
