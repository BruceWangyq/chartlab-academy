// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuizBlock } from "@/components/quiz-block";

vi.mock("@/components/deferred-market-chart", () => ({ DeferredMarketChart: () => <div aria-label="历史图表" /> }));

describe("QuizBlock", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.localStorage.clear(); });

  it("requires every answer, persists the attempt and reveals explanations", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ score: 2 }) });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<QuizBlock lessonId="m01-l01" questions={[
      { id: "q1", prompt: "第一题", options: ["正确一", "错误一"], answer: 0, explanation: "解析一" },
      { id: "q2", prompt: "图表判断题", options: ["错误二", "正确二"], answer: 1, explanation: "解析二", chartSeed: 101 },
    ]} />);

    const submit = screen.getByRole("button", { name: "检查答案" });
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: /正确一/ }));
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: /正确二/ }));
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(fetchMock).toHaveBeenCalledWith("/api/quiz/attempts", expect.objectContaining({ method: "POST" }));
    expect(await screen.findByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByText("解析一")).toBeInTheDocument();
    expect(screen.getByText("解析二")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem("chartlab:quiz:m01-l01") ?? "{}").score).toBe(2);
  });
});
