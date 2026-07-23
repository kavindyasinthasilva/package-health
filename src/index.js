import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { scanImports } from "./scanner.js";

export { extractPackageImports, scanImports } from "./scanner.js";

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function deprecatedMessage(packageName) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`);
  if (!response.ok) return;
  return (await response.json()).deprecated;
}

export async function checkPackageHealth(projectDirectory = process.cwd(), options = {}) {
  const manifest = JSON.parse(await readFile(path.join(projectDirectory, "package.json"), "utf8"));
  const runtime = manifest.dependencies ?? {};
  const development = options.includeDev === false ? {} : (manifest.devDependencies ?? {});
  const all = { ...runtime, ...development };
  const ignored = new Set(options.ignore ?? []);
  const findings = [];
  const imported = await scanImports(projectDirectory);

  for (const packageName of Object.keys(all)) {
    if (ignored.has(packageName)) continue;
    if (!await exists(path.join(projectDirectory, "node_modules", packageName))) {
      findings.push({ check: "missing", package: packageName, severity: "error",
        message: `${packageName} is declared but not installed` });
    }
    if (!imported.has(packageName)) {
      findings.push({ check: "unused", package: packageName, severity: "warning",
        message: `${packageName} may be unused` });
    }
  }
  for (const packageName of Object.keys(runtime)) {
    if (packageName in development) {
      findings.push({ check: "duplicate", package: packageName, severity: "warning",
        message: `${packageName} appears in dependencies and devDependencies` });
    }
  }
  if (options.checkDeprecated) {
    const results = await Promise.all(Object.keys(all).map(async (packageName) => ({
      packageName, message: await deprecatedMessage(packageName),
    })));
    for (const result of results) {
      if (result.message) findings.push({ check: "deprecated", package: result.packageName,
        severity: "warning", message: result.message });
    }
  }
  const penalty = findings.reduce(
    (total, finding) => total + (finding.severity === "error" ? 15 : 5), 0);
  return { project: manifest.name ?? path.basename(projectDirectory),
    score: Math.max(0, 100 - penalty), checkedDependencies: Object.keys(all).length, findings };
}
