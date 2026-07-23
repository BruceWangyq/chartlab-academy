import { mkdir, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import process from "node:process";

const port = process.env.LIGHTHOUSE_PORT ?? "3100";
const url = `http://127.0.0.1:${port}`;
const outputDirectory = new URL("../artifacts/", import.meta.url);
const outputPath = new URL("lighthouse-home.json", outputDirectory);
await mkdir(outputDirectory, { recursive: true });

const server = spawn("pnpm", ["start"], {
  cwd: new URL("../", import.meta.url),
  detached: process.platform !== "win32",
  env: { ...process.env, PORT: port },
  stdio: "ignore",
});

try {
  await waitForServer(url, 45_000);
  const exitCode = await run("pnpm", [
    "exec", "lighthouse", url,
    "--quiet",
    "--output=json",
    `--output-path=${outputPath.pathname}`,
    "--only-categories=performance,accessibility,best-practices,seo",
    "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage",
  ]);
  if (exitCode !== 0) throw new Error(`Lighthouse exited with code ${exitCode}`);

  const report = JSON.parse(await readFile(outputPath, "utf8"));
  const scores = Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)]));
  const metrics = {
    lcp: report.audits["largest-contentful-paint"].numericValue,
    cls: report.audits["cumulative-layout-shift"].numericValue,
    tbt: report.audits["total-blocking-time"].numericValue,
  };
  const failures = [
    ["performance score", scores.performance, 90],
    ["accessibility score", scores.accessibility, 100],
    ["best-practices score", scores["best-practices"], 95],
    ["SEO score", scores.seo, 100],
  ].flatMap(([label, actual, minimum]) => actual < minimum ? [`${label} ${actual} is below ${minimum}`] : []);
  if (metrics.lcp >= 2_500) failures.push(`LCP ${Math.round(metrics.lcp)}ms exceeds 2500ms`);
  if (metrics.cls >= 0.1) failures.push(`CLS ${metrics.cls.toFixed(3)} exceeds 0.1`);
  if (metrics.tbt >= 200) failures.push(`TBT ${Math.round(metrics.tbt)}ms exceeds 200ms`);

  console.log(`Lighthouse: performance ${scores.performance}, accessibility ${scores.accessibility}, best practices ${scores["best-practices"]}, SEO ${scores.seo}`);
  console.log(`Lab metrics: LCP ${Math.round(metrics.lcp)}ms, CLS ${metrics.cls.toFixed(3)}, TBT ${Math.round(metrics.tbt)}ms`);
  if (failures.length) throw new Error(failures.join("; "));
} finally {
  if (server.pid) {
    try { process.kill(process.platform === "win32" ? server.pid : -server.pid, "SIGTERM"); } catch { /* The server already stopped. */ }
  }
}

async function waitForServer(target, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try { if ((await fetch(target)).ok) return; } catch { /* Keep polling while Next starts. */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Production server did not start within ${timeout}ms`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: new URL("../", import.meta.url), stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
}
