import { describe, expect, it } from "vitest";
import { htmlTextLength, stripHtml } from "./html-text-length";

describe("html-text-length", () => {
  it("strips html tags from content", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("measures plain text length", () => {
    expect(htmlTextLength("<p>Hello <strong>world</strong></p>")).toBe(11);
  });
});
