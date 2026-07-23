#!/usr/bin/env node
import process from "node:process";
import { checkPackageHealth } from "./index.js";

const args = process.argv.slice(2);
const optionValue = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

function help() {
  console.log(`
package-health — check the health of your Node.js dependencies

Usage:
  package-health [directory] [options]

Options:
  --json             Print machine-readable JSON
  --production       Skip devDependencies
  --deprecated       Check the npm registry for deprecation notices
  --ignore <names>   Comma-separated package names to ignore
  --fail-on <level>  Exit non-zero on warning or error (default: error)
  -h, --help         Show this help
  -v, --version      Show the installed version
`.trim());
}

async function main() {
  if (args.includes("--help") || args.includes("-h")) return help();
  if (args.includes("--version") || args.includes("-v")) {
    const manifest = await import("../package.json", { with: { type: "json" } });
    return console.log(manifest.default.version);
  }
  const skipped = new Set();
  args.forEach((arg, index) => {
    if (["--ignore", "--fail-on"].includes(arg)) skipped.add(index + 1);
  });
  const directory = args.find((arg, index) => !arg.startsWith("-") && !skipped.has(index));
  const failOn = optionValue("--fail-on") ?? "error";
  if (!["warning", "error"].includes(failOn)) throw new Error("--fail-on must be warning or error");
  const report = await checkPackageHealth(directory, {
    includeDev: !args.includes("--production"),
    checkDeprecated: args.includes("--deprecated"),
    ignore: optionValue("--ignore")?.split(",") ?? [],
  });
  if (args.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`\n${report.project}: ${report.score}/100`);
    console.log(`${report.checkedDependencies} dependencies checked\n`);
    if (!report.findings.length) console.log("✓ No dependency health issues found");
    for (const finding of report.findings) {
      console.log(`${finding.severity === "error" ? "✗" : "!"} [${finding.check}] ${finding.message}`);
    }
  }
  if (report.findings.some((finding) =>
    failOn === "warning" ? finding.severity !== "info" : finding.severity === "error")) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`package-health: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
