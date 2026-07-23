import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractPackageImports } from "../src/scanner.js";

describe("extractPackageImports", () => {
  it("finds ESM, CommonJS, dynamic, and scoped imports", () => {
    const result = extractPackageImports(`
      import React from "react";
      export { x } from "@scope/tool/subpath";
      const fs = require("node:fs");
      const local = import("./local.js");
      const chalk = import("chalk");
    `);
    assert.deepEqual([...result].sort(), ["@scope/tool", "chalk", "react"]);
  });
});
