// filename: utils/reportGenerator.js
import fs from "fs";

export function saveReport(results, format = "json") {
  const fileName = `apitest-results.${format}`;

  if (format === "json") {
    fs.writeFileSync(fileName, JSON.stringify(results, null, 2));
  } else if (format === "csv") {
    const csv = [
      "METHOD,PATH,STATUS,TIME,ERROR",
      ...results.map(
        r =>
          `${r.method},${r.path},${r.status || ""},${r.time || ""},${r.error || ""}`
      ),
    ].join("\n");
    fs.writeFileSync(fileName, csv);
  }

  console.log(`📊 Results exported → ${fileName}`);
}
