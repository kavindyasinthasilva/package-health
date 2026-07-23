export type Severity = "info" | "warning" | "error";
export interface Finding {
  check: "missing" | "unused" | "duplicate" | "deprecated";
  package: string;
  severity: Severity;
  message: string;
}
export interface HealthReport {
  project: string;
  score: number;
  checkedDependencies: number;
  findings: Finding[];
}
export interface CheckOptions {
  includeDev?: boolean;
  checkDeprecated?: boolean;
  ignore?: string[];
}
export function extractPackageImports(source: string): Set<string>;
export function scanImports(projectDirectory: string): Promise<Set<string>>;
export function checkPackageHealth(
  projectDirectory?: string,
  options?: CheckOptions,
): Promise<HealthReport>;
