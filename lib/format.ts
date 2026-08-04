export function formatMillions(value: number | null): string {
  if (value === null) return "—";
  return `$${(value / 1_000_000).toFixed(1)}m`;
}
