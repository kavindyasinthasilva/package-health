import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkPackageHealth } from "../src/index.js";

describe("checkPackageHealth", () => {
  it("reports missing, unused, and duplicate packages", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "package-health-"));
    await mkdir(path.join(directory, "src"));
    await writeFile(path.join(directory, "package.json"), JSON.stringify({
      name: "fixture",
      dependencies: { react: "^19.0.0", chalk: "^5.0.0" },
      devDependencies: { react: "^19.0.0" },
    }));
    await writeFile(path.join(directory, "src", "index.js"), 'import React from "react";');
    const report = await checkPackageHealth(directory);
    assert.equal(report.project, "fixture");
    assert.equal(report.checkedDependencies, 2);
    for (const [check, packageName] of [
      ["missing", "react"], ["missing", "chalk"], ["unused", "chalk"], ["duplicate", "react"],
    ]) {
      assert.ok(report.findings.some((finding) =>
        finding.check === check && finding.package === packageName));
    }
  });
});
