# package-health

A fast, zero-config CLI that checks Node.js projects for dependency health issues.

## What it checks

- Declared dependencies that are not installed
- Dependencies that may be unused
- Packages duplicated across `dependencies` and `devDependencies`
- npm deprecation notices (opt-in)

## Install

Run it without installing:

```bash
npx @kavindu_yasintha_silva/package-health
```

Or install globally:

```bash
npm install --global @kavindu_yasintha_silva/package-health
package-health
```

Node.js 20 or newer is required.

## Usage

```text
package-health [directory] [options]

Options:
  --json             Print machine-readable JSON
  --production       Skip devDependencies
  --deprecated       Check the npm registry for deprecation notices
  --ignore <names>   Comma-separated package names to ignore
  --fail-on <level>  Exit non-zero on warning or error (default: error)
  -h, --help         Show help
  -v, --version      Show the installed version
```

Examples:

```bash
package-health
package-health ./apps/web --production
package-health --deprecated --ignore typescript,eslint
package-health --json > health-report.json
package-health --fail-on warning
```

The unused-dependency check is intentionally conservative and based on static imports. Packages used only through configuration files, plugins, generated code, or runtime-computed imports may need to be added to `--ignore`.

## Programmatic API

```js
import { checkPackageHealth } from "@kavindu_yasintha_silva/package-health";

const report = await checkPackageHealth(process.cwd(), {
  includeDev: true,
  checkDeprecated: false,
  ignore: ["a-config-only-plugin"],
});
```

## Development

```bash
npm install
npm run check
npm test
```

## License

MIT
