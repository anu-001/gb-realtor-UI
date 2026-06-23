import { useState, type ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import DOMPurify from "dompurify";
import { RichTextEditor } from "./RichTextEditor";

const sanitizeSpy = vi.spyOn(DOMPurify, "sanitize");

function Harness({
  initialValue = "<p>Hello</p>",
  ...props
}: Partial<ComponentProps<typeof RichTextEditor>> & { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <div>
      <RichTextEditor
        value={value}
        onChange={setValue}
        {...props}
      />
      <output data-testid="html">{value}</output>
    </div>
  );
}

beforeEach(() => {
  sanitizeSpy.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("RichTextEditor", () => {
  it("renders with the initial value", async () => {
    render(<Harness label="Description" />);

    expect(await screen.findByText("Hello")).toBeInTheDocument();
  });

  it("calls onChange with sanitized HTML on content change", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="<p>Hello<script>alert(1)</script></p>" />);

    const editor = await screen.findByRole("textbox");
    editor.focus();
    await user.keyboard("!");

    await waitFor(() => {
      expect(sanitizeSpy).toHaveBeenCalled();
    });

    expect(screen.getByTestId("html")).not.toHaveTextContent("<script>");
    expect(screen.getByTestId("html")).toHaveTextContent("Hello");
  });

  it("updates character count correctly", async () => {
    const user = userEvent.setup();
    render(<Harness maxCharacters={20} />);

    expect(screen.getByText("5 / 20 characters")).toBeInTheDocument();

    const editor = await screen.findByRole("textbox");
    editor.focus();
    await user.keyboard("!");

    await waitFor(() => {
      expect(screen.getByText("6 / 20 characters")).toBeInTheDocument();
    });
  });

  it("applies the error state", () => {
    const { container } = render(<Harness error="Required field" label="Body" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Required field");
    expect(container.querySelector(".rounded-input")).toHaveClass("border-[var(--color-danger)]");
  });

  it("prevents editing when disabled", async () => {
    const user = userEvent.setup();
    render(<Harness disabled />);

    const editor = await screen.findByRole("textbox");
    expect(editor).toHaveAttribute("contenteditable", "false");

    editor.focus();
    await user.keyboard(" more text");

    await waitFor(() => {
      expect(screen.getByTestId("html")).toHaveTextContent("Hello");
    });
  });
});
