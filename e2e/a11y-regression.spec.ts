import { expect, test, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function signIn(page: Page, testInfo: TestInfo) {
  const email = `a11y-${testInfo.project.name}@example.com`;
  const issued = await page.request.post("/api/auth/request-code", { data: { email } });
  expect(issued.ok()).toBe(true);
  const { demoCode } = await issued.json() as { demoCode: string };
  const verified = await page.request.post("/api/auth/verify", { data: { email, code: demoCode, next: "/dashboard" } });
  expect(verified.ok()).toBe(true);
}

test("representative public and account pages meet automated WCAG 2.2 A/AA checks", async ({ page }, testInfo) => {
  await page.context().addCookies([{ name: "chartlab_analytics_consent", value: "declined", domain: "localhost", path: "/" }]);
  await signIn(page, testInfo);
  const paths = [
    "/", "/courses", "/pricing", "/learn/chart-foundations/market-language",
    "/practice/historical-case-01", "/dashboard", "/review", "/notes",
    "/bookmarks", "/settings", "/billing",
  ];
  const failures: string[] = [];

  for (const path of paths) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    failures.push(...results.violations.map((item) => `${path} ${item.id}: ${item.help} (${item.nodes.map((node) => node.target.join(" ")).join(", ")})`));
  }
  expect(failures, failures.join("\n")).toEqual([]);
});

test("practice help keeps keyboard focus inside the modal and restores it on close", async ({ page }, testInfo) => {
  await page.context().addCookies([{ name: "chartlab_analytics_consent", value: "declined", domain: "localhost", path: "/" }]);
  await signIn(page, testInfo);
  await page.goto("/practice/historical-case-01");
  const trigger = page.getByRole("button", { name: "如何使用" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "完成一次历史案例" });
  await expect(dialog.getByRole("button", { name: "知道了" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog).toContainText("完成一次历史案例");
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("primary mobile controls provide at least 44 pixel touch targets", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Touch-target sizing is checked in the coarse-pointer mobile context.");
  await page.context().addCookies([{ name: "chartlab_analytics_consent", value: "declined", domain: "localhost", path: "/" }]);
  await signIn(page, testInfo);
  const failures: string[] = [];
  for (const path of ["/courses", "/cases", "/library", "/learn/chart-foundations/market-language", "/practice/historical-case-01", "/dashboard", "/settings"]) {
    await page.goto(path);
    const undersized = await page.locator("button, summary, input, select, textarea").evaluateAll((elements) => elements.flatMap((element) => {
      const input = element instanceof HTMLInputElement ? element : null;
      if (input?.type === "hidden") return [];
      const target = input && ["checkbox", "radio"].includes(input.type) ? element.closest("label") ?? element : element;
      const rect = target.getBoundingClientRect(); const style = getComputedStyle(target);
      if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0 || rect.height >= 44) return [];
      return [`${target.tagName.toLowerCase()}${target.className ? `.${String(target.className).replace(/\s+/g, ".")}` : ""}=${rect.height.toFixed(1)}px`];
    }));
    failures.push(...undersized.map((item) => `${path} ${item}`));
  }
  expect(failures, failures.join("\n")).toEqual([]);
});
