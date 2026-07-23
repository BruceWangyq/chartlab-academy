import { expect, test, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function signInForProtectedFlow(page: Page, testInfo: TestInfo) {
  const slug = testInfo.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 36);
  const email = `${slug}-${testInfo.project.name}-${testInfo.workerIndex}@example.com`;
  const issued = await page.request.post("/api/auth/request-code", { data: { email } });
  expect(issued.ok()).toBe(true);
  const { demoCode } = await issued.json() as { demoCode: string };
  const verified = await page.request.post("/api/auth/verify", { data: { email, code: demoCode, next: "/dashboard" } });
  expect(verified.ok()).toBe(true);
}
async function declineOptionalAnalytics(page: Page) { const button = page.getByRole("button", { name: "仅必要功能" }); if (await button.isVisible()) await button.click(); }

test("public learning path is complete", async ({ page }) => {
  await page.goto("/"); await expect(page.getByRole("heading", { name: /从看懂图表开始/ })).toBeVisible(); await expect(page.getByRole("img", { name: /历史K线图/ }).first()).toBeVisible(); await declineOptionalAnalytics(page);
  await page.getByRole("link", { name: /免费开始学习/ }).first().click(); await expect(page).toHaveURL(/courses\/chart-foundations/); await expect(page.getByRole("heading", { name: "图表基础", exact: true })).toBeVisible();
  await page.getByRole("link", { name: /开始第一课/ }).click(); await expect(page).toHaveURL(/learn\/chart-foundations\/market-language/); await expect(page.getByRole("heading", { level: 1, name: "市场如何写进图表", exact: true })).toBeVisible();
  const questions = page.locator(".quiz-block li"); await questions.nth(0).locator("label").nth(1).click(); await questions.nth(1).locator("label").nth(0).click(); await questions.nth(2).locator("label").nth(1).click(); await page.getByRole("button", { name: "检查答案" }).click(); await expect(page.locator(".quiz-block > header strong")).toHaveText("3 / 3");
});

test("practice submission returns structured server score", async ({ page }, testInfo) => {
  await signInForProtectedFlow(page, testInfo);
  await page.goto("/practice/historical-case-01"); await declineOptionalAnalytics(page); await expect(page.locator("canvas").first()).toBeVisible();
  await page.locator(".trend-options label").filter({ hasText: "下降" }).click(); const inputs = page.locator(".range-inputs input");
  for (const [index, value] of [[0, "80"], [1, "86"], [2, "112"], [3, "119"]] as const) await inputs.nth(index).fill(value);
  await page.getByLabel("关键反应位置").fill("24, 55, 83");
  await page.locator(".reason-tags label").filter({ hasText: "趋势/结构" }).click(); await page.locator(".reason-tags label").filter({ hasText: "失效条件" }).click();
  await page.locator(".task-form textarea").fill("价格形成更低的高点与更低的低点；若重新站回前高上方，则当前下降结构判断失效。"); await page.getByRole("button", { name: "提交分析" }).click();
  await expect(page.locator(".score-card")).toBeVisible(); await expect(page.locator(".score-card > strong")).toContainText("100"); await expect(page.getByText(/参考支撑/)).toBeVisible();
});

test("email code login returns to a protected learning center", async ({ page }, testInfo) => {
  const email = `learner-${testInfo.project.name}@example.com`;
  await page.goto("/dashboard"); await expect(page).toHaveURL(/login/); await page.getByLabel("邮箱地址").fill(email); await page.getByRole("button", { name: /获取验证码/ }).click();
  const demo = page.locator(".demo-code strong"); await expect(demo).toBeVisible(); const code = (await demo.textContent()) ?? ""; await page.getByLabel("6位验证码").fill(code); await page.getByRole("button", { name: /进入学习中心/ }).click();
  await expect(page).toHaveURL(/dashboard/); await expect(page.getByRole("heading", { name: "欢迎回来" })).toBeVisible(); await expect(page.getByText(email)).toBeVisible();
  const replay = await page.request.post("/api/auth/verify", { data: { email, code, next: "/dashboard" } }); expect(replay.status()).toBe(401);
});

test("paid learning content is protected on the page and API", async ({ page }) => {
  await page.goto("/learn/candlestick-language/single-bar"); await expect(page).toHaveURL(/login\?next=/);
  await page.goto("/practice/historical-case-01"); await expect(page).toHaveURL(/login\?next=/);
  const response = await page.request.post("/api/practice/case-01/attempts", { data: { trend: "up", support: [1, 2], resistance: [3, 4], reasonTags: ["structure"], reason: "这是一个用于校验访问控制的完整理由。", annotations: [] } });
  expect(response.status()).toBe(401);
});

for (const path of ["/", "/courses", "/login"]) test(`has no serious accessibility violations: ${path}`, async ({ page }) => { await page.goto(path); await page.waitForTimeout(400); const results = await new AxeBuilder({ page }).analyze(); const severe = results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? "")); expect(severe, severe.map((item) => `${item.id}: ${item.description}`).join("\n")).toEqual([]); });

test("core pages do not overflow on a narrow viewport", async ({ browser }, testInfo) => { const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true }); await signInForProtectedFlow(page, testInfo); for (const path of ["/", "/courses", "/practice/historical-case-01", "/login"]) { await page.goto(path); await page.waitForTimeout(250); const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(1); } await page.close(); });

test("chart has a keyboard-accessible tabular alternative", async ({ page }) => {
  await page.goto("/learn/chart-foundations/market-language");
  const summary = page.getByText("查看最近 10 根K线的表格数据");
  await summary.focus(); await page.keyboard.press("Enter");
  const table = page.getByRole("table", { name: /最近 10 个交易日/ });
  await expect(table).toBeVisible(); await expect(table.locator("tbody tr")).toHaveCount(10);
  await expect(table.getByRole("columnheader", { name: "成交量" })).toBeVisible();
});

test("practice can be completed without drawing or dragging", async ({ page }, testInfo) => {
  await signInForProtectedFlow(page, testInfo);
  await page.goto("/practice/historical-case-01"); await declineOptionalAnalytics(page);
  await page.getByLabel("下降").focus(); await page.keyboard.press("Space");
  const values = ["80", "86", "112", "119"]; const inputs = page.locator(".range-inputs input");
  for (let index = 0; index < values.length; index += 1) { await inputs.nth(index).focus(); await page.keyboard.type(values[index]); }
  await page.getByLabel("关键反应位置").focus(); await page.keyboard.type("24, 55, 83");
  await page.getByLabel("趋势/结构").focus(); await page.keyboard.press("Space"); await page.getByLabel("失效条件").focus(); await page.keyboard.press("Space");
  await page.locator(".task-form textarea").fill("价格形成更低的高点与低点，重新站上前高会推翻当前结构判断。");
  await page.getByRole("button", { name: "提交分析" }).focus(); await page.keyboard.press("Enter");
  await expect(page.locator(".score-card")).toBeVisible();
});

test("core learning page remains usable at 200 percent zoom", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-chrome", "200% reflow is verified at the WCAG desktop reference width; mobile has a separate narrow viewport test.");
  await page.goto("/learn/chart-foundations/market-language");
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await expect(page.getByRole("heading", { level: 1, name: "市场如何写进图表", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "检查答案" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("course and article expose valid structured data", async ({ page }) => {
  for (const [path, expectedType] of [["/courses/chart-foundations", "Course"], ["/library/what-is-technical-analysis", "Article"]]) {
    await page.goto(path);
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    expect(raw).toBeTruthy(); expect(JSON.parse(raw ?? "{}")["@type"]).toBe(expectedType);
  }
});

test("security headers and analytics validation fail closed", async ({ page }) => {
  const response = await page.goto("/"); expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  const scriptIntegrity = await page.locator('script[src^="/_next/"][integrity]').evaluateAll((scripts) => scripts.map((script) => script.getAttribute("integrity")));
  expect(scriptIntegrity.length).toBeGreaterThanOrEqual(4); expect(scriptIntegrity.every((value) => value?.startsWith("sha256-"))).toBe(true);
  const invalid = await page.request.post("/api/events", { headers: { "x-forwarded-for": "203.0.113.77" }, data: { event: "unknown", content: "must not be accepted" } });
  expect(invalid.status()).toBe(400);
  expect((await page.request.get("/api/health")).status()).toBe(503);
  expect((await page.request.get("/api/me/export")).status()).toBe(401);
  expect((await page.request.get("/api/cron/data-retention")).status()).toBe(503);
  expect((await page.request.get("/api/cron/subscription-reconcile")).status()).toBe(503);
});

test("analytics waits for regional consent and rejection keeps identifiers empty", async ({ page }) => {
  const analyticsRequests: string[] = []; page.on("request", (request) => { if (request.url().endsWith("/api/events")) analyticsRequests.push(request.url()); });
  await page.goto("/"); await page.waitForTimeout(300); expect(analyticsRequests).toHaveLength(0);
  await page.getByRole("button", { name: "仅必要功能" }).click();
  const state = await page.evaluate(() => ({ cookie: document.cookie, anonymousId: localStorage.getItem("chartlab:anonymous"), sessionId: sessionStorage.getItem("chartlab:session") }));
  expect(state.cookie).toContain("chartlab_analytics_consent=declined"); expect(state.anonymousId).toBeNull(); expect(state.sessionId).toBeNull();
});

test("home initial compressed JavaScript stays within 180 KB", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Chromium exposes consistent compressed transfer sizes for this budget check.");
  await page.goto("/", { waitUntil: "load" });
  const initialBytes = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
      .filter((entry) => entry.name.includes("/_next/static/") && entry.name.endsWith(".js") && entry.startTime <= navigation.loadEventEnd)
      .reduce((sum, entry) => sum + entry.transferSize, 0);
  });
  expect(initialBytes, `Initial JavaScript was ${(initialBytes / 1024).toFixed(1)} KB`).toBeLessThan(180 * 1024);
  await expect(page.getByRole("img", { name: /历史K线图/ }).first()).toBeVisible();
});
