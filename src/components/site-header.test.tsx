// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SiteHeader } from "@/components/site-header";

describe("SiteHeader", () => {
  afterEach(cleanup);

  it("exposes every primary destination in desktop and mobile navigation", () => {
    render(<SiteHeader />);

    for (const label of ["课程", "历史案例", "知识库", "定价"]) {
      expect(within(screen.getByRole("navigation", { name: "主导航" })).getByRole("link", { name: label })).toBeInTheDocument();
      expect(within(screen.getByRole("navigation", { name: "移动导航" })).getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("link", { name: /学习中心/ })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "登录 / 注册" })).toHaveAttribute("href", "/login");
    expect(document.querySelector('summary[aria-label="打开导航"]')).toBeInTheDocument();
  });
});
