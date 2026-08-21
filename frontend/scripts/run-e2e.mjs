import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const evidenceRoot = resolve(import.meta.dirname, "../../.omo/evidence/tdesign-vue-next-migration/task-1-playwright");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const arguments_ = process.argv.slice(2);
const runKind = arguments_.length === 0 ? "full" : "filtered";
const runDirectory = resolve(evidenceRoot, "runs", `${runKind}-${timestamp}`);
const reportPath = resolve(runDirectory, "report.json");
const outputDirectory = resolve(runDirectory, "test-results");
const playwrightCli = resolve(import.meta.dirname, "../node_modules/@playwright/test/cli.js");

await mkdir(runDirectory, { recursive: true });

const exitCode = await new Promise((resolveExit, reject) => {
  const child = spawn(process.execPath, [playwrightCli, "test", ...arguments_], {
    cwd: resolve(import.meta.dirname, ".."),
    env: {
      ...process.env,
      PLAYWRIGHT_OUTPUT_DIR: outputDirectory,
      PLAYWRIGHT_REPORT_PATH: reportPath,
    },
    stdio: "inherit",
  });
  child.once("error", reject);
  child.once("exit", code => resolveExit(code ?? 1));
});

if (exitCode === 0 && runKind === "full") {
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  const manifest = {
    completedAt: new Date().toISOString(),
    command: "pnpm --dir frontend run test:e2e",
    expected: report.stats.expected,
    unexpected: report.stats.unexpected,
    flaky: report.stats.flaky,
    report: relative(evidenceRoot, reportPath),
    artifacts: relative(evidenceRoot, outputDirectory),
  };
  await writeFile(resolve(evidenceRoot, "full-run-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

process.exit(exitCode);
