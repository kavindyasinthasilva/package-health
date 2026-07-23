import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_EXTENSIONS = new Set([
  ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts", ".vue", ".svelte",
]);
const IGNORED_DIRECTORIES = new Set([
  ".git", "node_modules", "dist", "build", "coverage", ".next", ".nuxt", ".output",
]);

function packageFromSpecifier(specifier) {
  if (specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("node:")) return;
  if (specifier.startsWith("@")) return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/")[0];
}

export function extractPackageImports(source) {
  const packages = new Set();
  const patterns = [
    /\b(?:import|export)\s+(?:[^"'`]*?\s+from\s+)?["']([^"']+)["']/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const packageName = match[1] ? packageFromSpecifier(match[1]) : undefined;
      if (packageName) packages.add(packageName);
    }
  }
  return packages;
}

async function walk(directory, files) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) await walk(path.join(directory, entry.name), files);
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(path.join(directory, entry.name));
    }
  }));
}

export async function scanImports(projectDirectory) {
  const files = [];
  await walk(projectDirectory, files);
  const imported = new Set();
  await Promise.all(files.map(async (file) => {
    const source = await readFile(file, "utf8");
    for (const packageName of extractPackageImports(source)) imported.add(packageName);
  }));
  return imported;
}
