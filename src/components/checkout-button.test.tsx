// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CheckoutButton } from "@/components/checkout-button";

describe("CheckoutButton", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("sends only the internal plan key and exposes checkout failures", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "结账暂时不可用" }) });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<CheckoutButton plan="annual" label="选择年付" />);

    await user.click(screen.getByRole("button", { name: "选择年付" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: "annual" }),
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("结账暂时不可用");
    expect(screen.getByRole("button", { name: "选择年付" })).toBeEnabled();
  });
});
