import { Grid2X2, List, Map as MapIcon, ArrowUpDown } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setViewMode } from "@/store/slices/uiSlice";

type SortToolbarProps = {
  total: number;
  sort: string;
  onSortChange: (value: string) => void;
};

export function SortToolbar({ total, sort, onSortChange }: SortToolbarProps) {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state) => state.ui.viewMode);
  const modes = [
    { mode: "grid", Icon: Grid2X2 },
    { mode: "list", Icon: List },
    { mode: "map", Icon: MapIcon },
  ] as const;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-card">
      <p className="text-sm text-[var(--color-text-secondary)]">{total} properties found</p>
      <div className="flex items-center gap-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <ArrowUpDown className="h-4 w-4" />
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="h-10 rounded-input border border-[var(--color-border)] px-3"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="featured_first">Featured</option>
          </select>
        </label>
        <div className="inline-flex overflow-hidden rounded-input border border-[var(--color-border)]">
          {modes.map(({ mode, Icon }) => (
            <button
              key={mode}
              type="button"
              aria-label={mode}
              onClick={() => dispatch(setViewMode(mode as "grid" | "list" | "map"))}
              className={`inline-flex h-10 w-10 items-center justify-center ${
                viewMode === mode ? "bg-[var(--color-accent)] text-white" : "bg-transparent text-[var(--color-text-secondary)]"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
