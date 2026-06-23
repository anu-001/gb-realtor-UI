import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, beforeEach, afterEach, it, vi } from "vitest";
import PropertyDetailPage from "./PropertyDetailPage";
import * as propertiesService from "@/services/properties.service";

const mockGetPublicPropertyById = vi.spyOn(propertiesService, "getPublicPropertyById");

function renderPage(): ReturnType<typeof render> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/properties/property-1"]}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const baseProperty = {
  id: "property-1",
  title: "Modern Family Home",
  area: "Ikeja",
  city: "Lagos",
  state: "Lagos",
  listingType: "sale",
  publishedAt: "2026-06-23T12:00:00.000Z",
  thumbnails: [{ url: "https://example.com/property.jpg", altText: "Front view" }],
};

describe("PropertyDetailPage", () => {
  const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");

  beforeEach(() => {
    mockGetPublicPropertyById.mockReset();
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => 640,
    });
  });

  afterEach(() => {
    if (originalScrollHeight) {
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
    }
  });

  it("renders rich HTML content and supports expand/collapse", async () => {
    mockGetPublicPropertyById.mockResolvedValue({
      ...baseProperty,
      description:
        "<h2>Overview</h2><p>Beautiful home with <strong>premium</strong> finishes.</p><ul><li>4 bedrooms</li><li>3 bathrooms</li></ul><blockquote>Quiet neighborhood and great natural light.</blockquote>",
    } as never);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Modern Family Home" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Overview", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("4 bedrooms")).toBeInTheDocument();
    expect(screen.getByText("Quiet neighborhood and great natural light.")).toBeInTheDocument();

    const toggle = await screen.findByRole("button", { name: /show more/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: /show less/i })).toHaveAttribute("aria-expanded", "true");
  });

  it("shows an inline empty state when description is missing", async () => {
    mockGetPublicPropertyById.mockResolvedValue({
      ...baseProperty,
      description: "",
    } as never);

    renderPage();

    expect(await screen.findByText("No description provided")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show more/i })).not.toBeInTheDocument();
  });
});
