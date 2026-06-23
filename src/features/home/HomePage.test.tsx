import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import HomePage from "./HomePage";
import * as propertiesService from "@/services/properties.service";

const getFeaturedPropertiesSpy = vi.spyOn(propertiesService, "getFeaturedProperties");
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
    getFeaturedPropertiesSpy.mockReset();
    getPublicListingsSpy.mockReset();
  });

  it("renders the hero, featured rail, and listing grid", async () => {
    getFeaturedPropertiesSpy.mockResolvedValue([
      {
        id: "featured-1",
        title: "Glass House in Ikoyi",
        description: "Modern home.",
        purpose: "sale",
        status: "published",
        state: "Lagos",
        city: "Lagos",
        area: "Ikoyi",
        priceKobo: "125000000",
        bedrooms: 4,
        bathrooms: 4,
        createdAt: "2026-06-23T12:00:00.000Z",
        updatedAt: "2026-06-23T12:00:00.000Z",
      },
    ] as never);

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
    expect(await screen.findByText("Featured listings")).toBeInTheDocument();
    expect(await screen.findByText("Glass House in Ikoyi")).toBeInTheDocument();
    expect(await screen.findByText("Modern Family Home")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open full search/i })).toBeInTheDocument();
  });
});
