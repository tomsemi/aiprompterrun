import { describe, expect, it } from "vitest";
import { faqItems, meta, primaryActions, steps } from "./site";

describe("site data", () => {
  it("keeps the remote CTA pointed at the existing remote domain", () => {
    expect(primaryActions.remote.href).toBe("https://remote.aiprompter.run/");
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
