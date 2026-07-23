import process from "node:process";

const input = process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL;
if (!input) throw new Error("Provide the production URL as the first argument or NEXT_PUBLIC_SITE_URL.");
const base = new URL(input);
if (base.protocol !== "https:") throw new Error("Production verification requires an HTTPS URL.");

const checks = [];
function check(name, passed, detail) { checks.push({ name, passed: Boolean(passed), detail }); }

async function request(path, init = {}) {
  const response = await fetch(new URL(path, base), { ...init, redirect: "manual", signal: AbortSignal.timeout(15_000) });
  const body = await response.text();
  return { response, body };
}

for (const path of ["/", "/courses", "/cases", "/pricing", "/login", "/legal/privacy", "/legal/terms", "/legal/refund", "/legal/disclaimer"]) {
  try {
    const { response } = await request(path);
    check(`${path} returns 200`, response.status === 200, `received ${response.status}`);
  } catch (error) { check(`${path} returns 200`, false, error.message); }
}

try {
  const { response, body } = await request("/");
  const csp = response.headers.get("content-security-policy") ?? "";
  check("Strict security headers", csp.includes("frame-ancestors 'none'") && response.headers.get("x-content-type-options") === "nosniff", "CSP or nosniff is missing");
  check("Production canonical", body.includes('rel="canonical"') && body.includes(base.origin), "canonical does not reference the production origin");
} catch (error) { check("Homepage metadata and security", false, error.message); }

try {
  const { response, body } = await request("/robots.txt");
  check("robots.txt and sitemap pointer", response.status === 200 && /Sitemap:/i.test(body) && body.includes(base.origin), `received ${response.status}`);
} catch (error) { check("robots.txt and sitemap pointer", false, error.message); }

try {
  const { response, body } = await request("/sitemap.xml");
  check("sitemap.xml", response.status === 200 && body.includes(base.origin) && body.includes("/courses"), `received ${response.status}`);
} catch (error) { check("sitemap.xml", false, error.message); }

try {
  const { response } = await request(`/verification-missing-${Date.now()}`);
  check("Unknown routes return 404", response.status === 404, `received ${response.status}`);
} catch (error) { check("Unknown routes return 404", false, error.message); }

try {
  const token = process.env.HEALTHCHECK_SECRET;
  if (!token) check("Authenticated health check", false, "HEALTHCHECK_SECRET is missing");
  else {
    const { response, body } = await request("/api/health", { headers: { authorization: `Bearer ${token}` } });
    let payload; try { payload = JSON.parse(body); } catch { payload = null; }
    check("Authenticated health check", response.status === 200 && payload?.ok === true, `received ${response.status}`);
  }
} catch (error) { check("Authenticated health check", false, error.message); }

for (const item of checks) console.log(`${item.passed ? "PASS" : "FAIL"}  ${item.name}${item.passed ? "" : ` — ${item.detail}`}`);
const failures = checks.filter((item) => !item.passed);
console.log(`\nProduction smoke: ${checks.length - failures.length}/${checks.length} checks passed for ${base.origin}.`);
if (failures.length) process.exitCode = 1;
