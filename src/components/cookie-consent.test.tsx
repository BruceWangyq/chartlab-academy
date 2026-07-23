// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CookieConsent } from "@/components/cookie-consent";
import { ANALYTICS_CONSENT_COOKIE } from "@/lib/consent";

describe("CookieConsent", () => {
  beforeEach(() => {
    document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Path=/; Max-Age=0`;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("records rejection, announces the change and closes without blocking functionality", async () => {
    const user = userEvent.setup();
    let choice = "";
    window.addEventListener("chartlab:analytics-consent", (event) => { choice = (event as CustomEvent<string>).detail; }, { once: true });
    render(<CookieConsent mode="required" />);

    await user.click(screen.getByRole("button", { name: "仅必要功能" }));

    expect(document.cookie).toContain(`${ANALYTICS_CONSENT_COOKIE}=declined`);
    expect(choice).toBe("declined");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not show a prompt when analytics is disabled", () => {
    render(<CookieConsent mode="disabled" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
