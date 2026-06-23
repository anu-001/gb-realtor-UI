import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RichTextContent } from "./RichTextContent";

describe("RichTextContent", () => {
  it("sanitizes html and adds safe link attributes", () => {
    render(
      <RichTextContent html='<p>Hello <a href="https://example.com">link</a><script>alert(1)</script></p>' />,
    );

    const link = screen.getByRole("link", { name: "link" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
  });
});
