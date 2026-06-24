import { Grid2X2, List, Map as MapIcon, ArrowUpDown } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setViewMode } from "@/store/slices/uiSlice";

type SortToolbarProps = {
  total: number;
  sort: string;
  onSortChange: (value: string) => void;
  pageSize?: number;
  onPageSizeChange?: (value: number) => void;
};

export function SortToolbar({ total, sort, onSortChange, pageSize, onPageSizeChange }: SortToolbarProps) {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state) => state.ui.viewMode);
  const modes = [
    { mode: "grid", Icon: Grid2X2 },
    { mode: "list", Icon: List },
    { mode: "map", Icon: MapIcon },
  ] as const;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-modal border border-[var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface)_97%,white)_0%,var(--color-surface)_100%)] p-4 shadow-card">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          {total.toLocaleString("en-NG")} properties found
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <ArrowUpDown className="h-4 w-4" />
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="ui-field h-10 min-w-36"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="featured_first">Featured</option>
          </select>
        </label>
        {onPageSizeChange ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Per page</span>
            <select
              value={pageSize ?? 25}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="ui-field h-10 w-24"
            >
              {[12, 25, 48].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="inline-flex overflow-hidden rounded-input border border-[var(--color-border)]">
          {modes.map(({ mode, Icon }) => (
            <button
              key={mode}
              type="button"
              aria-label={`Switch to ${mode} view`}
              onClick={() => dispatch(setViewMode(mode as "grid" | "list" | "map"))}
              className={`inline-flex h-10 w-10 items-center justify-center transition ${
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
