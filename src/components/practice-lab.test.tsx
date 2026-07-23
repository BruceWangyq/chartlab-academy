// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PracticeLab } from "@/components/practice-lab";
import { chartCases } from "@/lib/content";

vi.mock("@/components/market-chart", () => ({ MarketChart: () => <div aria-label="历史练习图表" /> }));

describe("PracticeLab", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });
  afterEach(() => { cleanup(); window.localStorage.clear(); vi.unstubAllGlobals(); });

  it("creates and clears a trendline annotation without submitting an answer", async () => {
    const user = userEvent.setup();
    render(<PracticeLab chartCase={chartCases[0]} />);
    await user.click(screen.getByRole("button", { name: "趋势线" }));

    const layer = screen.getByLabelText("图表标注层");
    vi.spyOn(layer, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, toJSON: () => ({}),
    });
    fireEvent.click(layer, { clientX: 20, clientY: 30 });
    fireEvent.click(layer, { clientX: 80, clientY: 70 });

    expect(layer.querySelector("line")).toHaveAttribute("x1", "20");
    expect(layer.querySelector("line")).toHaveAttribute("y2", "70");
    expect(fetch).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "清除全部" }));
    expect(layer.querySelector("line")).not.toBeInTheDocument();
  });
});
