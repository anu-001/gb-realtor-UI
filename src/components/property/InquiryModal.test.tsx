import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { InquiryModal } from "./InquiryModal";
import * as leadsService from "@/services/leads.service";

const createLeadSpy = vi.spyOn(leadsService, "createPublicLead");
let lastRichTextEditorFieldProps: Record<string, unknown> | null = null;

vi.mock("@/components/ui/RichTextEditorField", () => ({
  RichTextEditorField: ({
    control,
    name,
    label,
    ...props
  }: {
    control: Control<FieldValues>;
    name: Path<FieldValues>;
    label?: string;
  } & Record<string, unknown>) => {
    lastRichTextEditorFieldProps = props;
    return (
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <div>
            <textarea aria-label={label} value={field.value} onChange={field.onChange} />
            {fieldState.error?.message ? <p>{fieldState.error.message}</p> : null}
          </div>
        )}
      />
    );
  },
}));

describe("InquiryModal", () => {
  beforeEach(() => {
    createLeadSpy.mockReset();
    lastRichTextEditorFieldProps = null;
  });

  it("renders the restricted rich text editor configuration", () => {
    render(
      <InquiryModal
        open
        onOpenChange={vi.fn()}
        propertyId="property-1"
        propertyTitle="Modern Family Home"
        preferredLocation="Lagos"
      />,
    );

    expect(screen.getByText("Inquire about this property")).toBeInTheDocument();
    expect(lastRichTextEditorFieldProps).toMatchObject({
      toolbarVariant: "minimal",
      minHeight: 120,
      maxCharacters: 1000,
    });
  });

  it("validates required fields before submit", async () => {
    render(<InquiryModal open onOpenChange={vi.fn()} propertyId="property-1" />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /submit inquiry/i }));

    expect(await screen.findByText("Full name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Inquiry notes are required")).toBeInTheDocument();
  });

  it("submits sanitized inquiry notes and shows success", async () => {
    createLeadSpy.mockResolvedValue({} as never);

    render(
      <InquiryModal
        open
        onOpenChange={vi.fn()}
        propertyId="property-1"
        propertyTitle="Modern Family Home"
        preferredLocation="Lagos"
      />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Full name"), "Jane Doe");
    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Phone number"), "+2348000000000");
    await user.type(screen.getByLabelText("Inquiry Notes"), "We are looking for a family home.");
    await user.click(screen.getByRole("button", { name: /submit inquiry/i }));

    await waitFor(() => {
      expect(createLeadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyId: "property-1",
          inquiryNotes: expect.stringContaining("We are looking for a family home."),
          preferredLocation: "Lagos",
        }),
      );
    });

    expect(await screen.findByText("Thank you Jane Doe, we will contact you within 24 hours.")).toBeInTheDocument();
  });

  it("shows the rate limit message on 429 errors", async () => {
    createLeadSpy.mockRejectedValue({ statusCode: 429 });

    render(<InquiryModal open onOpenChange={vi.fn()} propertyId="property-1" />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Full name"), "Jane Doe");
    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Inquiry Notes"), "Please reach out.");
    await user.click(screen.getByRole("button", { name: /submit inquiry/i }));

    expect(await screen.findByText("Too many requests, please try again later")).toBeInTheDocument();
  });
});
