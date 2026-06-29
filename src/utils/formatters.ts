export function formatCompactNaira(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "Price on request";

  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return String(value);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}
