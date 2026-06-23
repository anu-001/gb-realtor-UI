import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import HomePage from "./HomePage";
import * as propertiesService from "@/services/properties.service";

const getPublicListingsSpy = vi.spyOn(propertiesService, "getPublicListings");

function renderHome() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    getPublicListingsSpy.mockReset();
  });

  it("renders the hero and live listing grid", async () => {
    getPublicListingsSpy.mockResolvedValue({
      data: [
        {
          id: "property-1",
          title: "Modern Family Home",
          area: "Ikeja",
          city: "Lagos",
          state: "Lagos",
          listingType: "sale",
          priceKobo: "85000000",
          bedrooms: 3,
          bathrooms: 3,
          sizeSqm: 240,
          thumbnails: [{ url: "https://example.com/image.jpg", altText: "Front view" }],
        },
      ],
      meta: { page: 1, pageSize: 9, total: 1, totalPages: 1 },
    } as never);

    renderHome();

    expect(await screen.findByRole("heading", { name: /find the right property, faster\./i })).toBeInTheDocument();
    expect(await screen.findByText("Live listings")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view details for modern family home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request a property/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view results/i })).toBeInTheDocument();
  });
});
