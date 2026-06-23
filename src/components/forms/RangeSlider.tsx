import { useMemo } from "react";

type RangeSliderProps = {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  label?: string;
};

export function RangeSlider({ min, max, value, onChange, formatValue = (next) => String(next), label }: RangeSliderProps) {
  const display = useMemo(() => `${formatValue(value[0])} - ${formatValue(value[1])}`, [formatValue, value]);

  return (
    <div className="space-y-3">
      {label ? <div className="text-sm font-medium text-[var(--color-text-primary)]">{label}</div> : null}
      <div className="flex items-center gap-3">
        <input
          aria-label={`${label ?? "Range"} minimum`}
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={(event) => onChange([Number(event.target.value), value[1]])}
          className="w-full accent-[var(--color-accent)]"
        />
        <input
          aria-label={`${label ?? "Range"} maximum`}
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={(event) => onChange([value[0], Number(event.target.value)])}
          className="w-full accent-[var(--color-accent)]"
        />
      </div>
      <div className="text-caption text-[var(--color-text-secondary)]">{display}</div>
    </div>
  );
}
