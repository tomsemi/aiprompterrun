import { describe, expect, it } from "vitest";
import { faqItems, meta, primaryActions, steps } from "./site";

describe("site data", () => {
  it("points the download CTA at the App Store listing", () => {
    expect(primaryActions.download.href).toBe("https://apps.apple.com/app/id1561831359");
  });

  it("points the remote CTA at the ChatUtil remote domain", () => {
    expect(primaryActions.remote.href).toBe("https://remote.chatutil.top/");
  });

  it("exposes a room-code setup explanation in the how-it-works steps", () => {
    expect(steps.map((step) => step.title)).toContain("Enter the room code on web remote");
  });

  it("includes FAQ items for remote flow and second-device setup", () => {
    const questions = faqItems.map((item) => item.question);
    expect(questions).toContain("Do I need two devices?");
    expect(questions).toContain("How does the web remote work?");
  });

  it("defines metadata for both homepage and faq", () => {
    expect(meta.home.title.length).toBeGreaterThan(20);
    expect(meta.faq.title.length).toBeGreaterThan(20);
  });

  it("keeps exactly two primary homepage actions", () => {
    expect(Object.keys(primaryActions)).toEqual(["download", "remote"]);
  });
});
