/**
 * Display formatting only. Every function here takes a value straight from the
 * source JSON and changes how it is *rendered* — never what it is. The minus
 * glyph is U+2212 (true minus) rather than a hyphen so negatives align in
 * tabular figures; that is a glyph choice, not a value change.
 */

const MINUS = "−";
const EM_DASH = "—";

/** 39597408 -> "$39.6m"; null -> "—" */
export function formatMillions(value: number | null): string {
  if (value === null) return EM_DASH;
  return `$${(value / 1_000_000).toFixed(1)}m`;
}

/**
 * Bench surplus value, with an explicit sign so polarity never rides on colour
 * alone: 26089599 -> "+$26.1m", -33099774 -> "−$33.1m", 45105 -> "+$0.0m".
 * The sign glyph for negatives is U+2212 (true minus).
 */
export function formatSurplus(value: number): string {
  const magnitude = `$${(Math.abs(value) / 1_000_000).toFixed(1)}m`;
  if (value < 0) return `${MINUS}${magnitude}`;
  return `+${magnitude}`;
}

/** Axis ticks: 40000000 -> "$40m" */
export function formatAxisMillions(value: number): string {
  return `$${Math.round(value / 1_000_000)}m`;
}

/**
 * U+2007 FIGURE SPACE — one digit wide. Fills the 1ch sign slot ahead of an
 * unsigned number so its decimal point stays on the column rule.
 */
export const FIGURE_SPACE = " ";

/** Source precision, no invented digits: 2.2 stays "2.2", 1.714 stays "1.714". */
export function sourcePrecision(value: number): string {
  return withMinusGlyph(String(value));
}

/** Replace the hyphen in a formatted number with a true minus glyph. */
export function withMinusGlyph(text: string): string {
  return text.replace(/-/g, MINUS);
}

/** 1.96 -> "+1.96"; -0.82 -> "−0.82"; 0 -> "0.00" (no sign) */
export function signed(value: number, digits = 2): string {
  const fixed = Math.abs(value).toFixed(digits);
  if (value > 0) return `+${fixed}`;
  if (value < 0) return `${MINUS}${fixed}`;
  return fixed;
}

/** Unsigned fixed-precision, with a true minus if negative. */
export function fixed(value: number, digits = 2): string {
  return withMinusGlyph(value.toFixed(digits));
}

/** Minutes per game: 30.8 -> "30.8" */
export function formatMinutes(value: number): string {
  return value.toFixed(1);
}
