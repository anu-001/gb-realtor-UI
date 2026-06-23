import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { RangeSlider } from "@/components/forms/RangeSlider";
import { PropertyType } from "@/constants/api-enums";

export type SearchFilters = {
  location?: string;
  state?: string;
  city?: string;
  type?: string;
  listingType?: string;
  beds?: number | "";
  minPriceKobo?: number | "";
  maxPriceKobo?: number | "";
};

type FilterPanelProps = {
  value: SearchFilters;
  onChange: (next: Partial<SearchFilters>) => void;
  onClear: () => void;
};

const cities = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Benin City", "Owerri", "Kaduna", "Ilorin"];

export function FilterPanel({ value, onChange, onClear }: FilterPanelProps) {
  const merged = useMemo(() => ({ ...value }), [value]);

  return (
    <aside className="space-y-5 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-h4">Filters</h2>
        <button type="button" onClick={onClear} className="text-sm font-medium text-[var(--color-accent)]">
          Clear
        </button>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Location</span>
        <input
          value={merged.location ?? ""}
          onChange={(event) => onChange({ ...merged, location: event.target.value })}
          list="city-suggestions"
          placeholder="Search city or state"
          className="h-11 w-full rounded-input border border-[var(--color-border)] px-4"
        />
        <datalist id="city-suggestions">
          {cities.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Property Type</span>
        <select
          value={merged.type ?? ""}
          onChange={(event) => onChange({ ...merged, type: event.target.value })}
          className="h-11 w-full rounded-input border border-[var(--color-border)] px-4"
        >
          <option value="">Any</option>
          {Object.values(PropertyType).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Listing Type</span>
        <select
          value={merged.listingType ?? ""}
          onChange={(event) => onChange({ ...merged, listingType: event.target.value })}
          className="h-11 w-full rounded-input border border-[var(--color-border)] px-4"
        >
          <option value="">Any</option>
          <option value="sale">Buy</option>
          <option value="rent">Rent</option>
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Bedrooms</span>
        <select
          value={merged.beds ?? ""}
          onChange={(event) => onChange({ ...merged, beds: event.target.value ? Number(event.target.value) : "" })}
          className="h-11 w-full rounded-input border border-[var(--color-border)] px-4"
        >
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((count) => (
            <option key={count} value={count}>
              {count}+
            </option>
          ))}
        </select>
      </label>

      <RangeSlider
        label="Price range"
        min={0}
        max={500000000}
        value={[Number(merged.minPriceKobo ?? 0), Number(merged.maxPriceKobo ?? 500000000)]}
        onChange={([minPriceKobo, maxPriceKobo]) => onChange({ ...merged, minPriceKobo, maxPriceKobo })}
        formatValue={(value) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value)}
      />

      <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)]">
        <ChevronDown className="h-4 w-4" />
        More filters
      </button>
    </aside>
  );
}
