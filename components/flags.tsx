import type { CSSProperties } from "react";
import type { DataFlag, ImputeReason } from "@/lib/types";

/**
 * The two imputation reasons are visually and verbally distinct, because they
 * mean different things:
 *
 *   rookie_no_history      a MODELED placeholder — not a real stat  (amber ◆)
 *   returning_from_injury  a REAL prior-season stat, reused         (steel ⟲)
 *
 * Amber reads as caution ("we invented this"); steel reads as neutral ("this is
 * real, just older"). Colour, glyph, and label all differ, so the distinction
 * survives colour-blindness and greyscale.
 */
export const REASON_META: Record<
  ImputeReason,
  { glyph: string; short: string; kind: string; color: string; describe: string }
> = {
  rookie_no_history: {
    glyph: "◆",
    short: "modeled",
    kind: "Modeled placeholder",
    color: "var(--flag)",
    describe: "a modeled placeholder, not a real stat",
  },
  returning_from_injury: {
    glyph: "⟲",
    short: "prior season",
    kind: "Prior-season stat",
    color: "var(--prior)",
    describe: "a real prior-season stat, reused as this season's prior",
  },
};

/** A small inline marker beside a flagged player's name. Glyph only, with the
 *  full explanation available on hover/focus and, where used, in an expansion. */
export function FlagMark({
  reason,
  title,
  className = "",
}: {
  reason: ImputeReason;
  title?: string;
  className?: string;
}) {
  const meta = REASON_META[reason];
  return (
    <span
      className={className}
      role="img"
      aria-label={title ?? `${meta.kind}: ${meta.describe}`}
      title={title ?? `${meta.kind} — ${meta.describe}`}
      style={{ color: meta.color, fontSize: "0.85em", lineHeight: 1 }}
    >
      {meta.glyph}
    </span>
  );
}

/** A labelled chip: glyph + short label. Used where there is room to name the
 *  kind, e.g. a table's expanded flag row or the methodology legend. */
export function FlagChip({ reason, style }: { reason: ImputeReason; style?: CSSProperties }) {
  const meta = REASON_META[reason];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px]"
      style={{
        padding: "2px 7px",
        border: `1px solid ${meta.color}`,
        color: meta.color,
        borderStyle: reason === "rookie_no_history" ? "dashed" : "solid",
        letterSpacing: "0.02em",
        ...style,
      }}
    >
      <span aria-hidden="true">{meta.glyph}</span>
      {meta.short}
    </span>
  );
}

/** The full disclosure block: every flag entry for a team, each naming the
 *  player, the kind, and the source note verbatim. */
export function FlagDetails({ flags }: { flags: DataFlag[] }) {
  if (flags.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {flags.map((flag) => (
        <li key={`${flag.player}-${flag.reason}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <FlagChip reason={flag.reason} />
          <span className="text-[13px]" style={{ fontWeight: 500, color: "var(--text-hi)" }}>
            {flag.player}
          </span>
          <span className="text-[12.5px]" style={{ color: "var(--text-lo)" }}>
            {flag.note}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Legend used once in the methodology, explaining both marks. */
export function FlagLegend() {
  return (
    <div className="flex flex-col gap-3">
      {(Object.keys(REASON_META) as ImputeReason[]).map((reason) => (
        <div key={reason} className="flex items-baseline gap-3">
          <FlagChip reason={reason} />
          <span className="text-[13.5px]" style={{ color: "var(--text-mid)" }}>
            {REASON_META[reason].kind} — {REASON_META[reason].describe}.
          </span>
        </div>
      ))}
    </div>
  );
}
