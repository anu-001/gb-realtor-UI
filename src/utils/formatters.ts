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

export function formatPropertyStatus(value: string | null | undefined): string {
  if (!value) return "";

  const normalized = value.trim().toLowerCase();
  const labels: Record<string, string> = {
    rent: "Rent",
    sale: "Sale",
    short_let: "Short Let",
    "short let": "Short Let",
  };

  return labels[normalized] ?? value;
}

export function formatNumberWithCommas(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";

  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return "";

  return new Intl.NumberFormat("en-NG").format(Number(digits));
}

export function stripNumberFormatting(value: string | null | undefined): string | undefined {
  const digits = value?.replace(/[^\d]/g, "");
  return digits ? digits : undefined;
}
