// filename: utils/reportGenerator.js
import fs from "fs";

export function saveReport(results, format = "json") {
  const fileName = `apitest-results.${format}`;

  if (format === "json") {
    fs.writeFileSync(fileName, JSON.stringify(results, null, 2));