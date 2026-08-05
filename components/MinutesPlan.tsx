"use client";

import { useMemo } from "react";
import type { MinutesRow } from "@/lib/types";
import { FIGURE_SPACE, formatMinutes, signed } from "@/lib/format";
import { isAchromatic, teamIdentity } from "@/lib/teamColors";
import { useReducedMotion, useReveal } from "@/lib/motion";
import { FlagMark } from "@/components/flags";
import { Num } from "@/components/ui";

/** Fixed domain, so bars stay comparable across teams and never rescale. */
const DOMAIN = 44;
const CEILING = 36;

export function MinutesPlan({ code, rows }: { code: string; rows: MinutesRow[] }) {
  const identity = teamIdentity(code);
  const hollow = isAchromatic(code);
  const reduced = useReducedMotion();
  const [ref, revealed] = useReveal<HTMLDivElement>();

  /**
   * opt desc, then cur desc, then bpm desc, then name — every team has three to
   * six players pinned at exactly 36.0, so a declared tiebreaker is the top of
   * the list, not an edge case.
   */
  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) => b.opt - a.opt || b.cur - a.cur || b.bpm - a.bpm || a.name.localeCompare(b.name),
      ),
    [rows],
  );

  const atCeiling = sorted.filter((r) => r.opt === CEILING).length;

  return (
    <div ref={ref} style={{ "--team": identity.color } as React.CSSProperties}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h3
          className="text-[18px] sm:text-[20px]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--text-hi)" }}
        >
          {identity.name}
        </h3>
      </div>

      <Num className="text-[11.5px]" style={{ color: "var(--text-lo)" }}>
        Model ceiling {formatMinutes(CEILING)} · {atCeiling} of these {sorted.length} players sit
        exactly here
      </Num>

      <div className="mt-4 flex flex-col gap-2">
        {sorted.map((row, index) => {
          const curPct = (row.cur / DOMAIN) * 100;
          const optPct = (row.opt / DOMAIN) * 100;
          const positive = row.delta > 0;
          const zero = row.delta === 0;

          return (
            <div
              key={row.name}
              className="grid items-center gap-x-3 gap-y-1 sm:gap-x-4"
              style={{
                gridTemplateColumns: "minmax(0,1fr) 92px",
                background: "var(--bg-raised)",
                borderBottom: "1px solid var(--rule-1)",
                padding: "8px 12px",
              }}
            >
              <div className="min-w-0 sm:hidden">
                <div
                  className="flex items-center gap-1.5 text-[14.5px]"
                  style={{ fontWeight: 500, color: "var(--text-hi)" }}
                >
                  <span className="truncate">{row.name}</span>
                  {row.imputed && <FlagMark reason={row.imputed} />}
                </div>
              </div>
              <div className="text-right sm:hidden">
                <DeltaLabel delta={row.delta} positive={positive} zero={zero} />
              </div>

              <div className="col-span-2 grid items-center gap-3 sm:col-span-1 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-4">
                <div className="hidden min-w-0 sm:block">
                  <div
                    className="flex items-center gap-1.5 text-[14.5px]"
                    style={{ fontWeight: 500, color: "var(--text-hi)" }}
                  >
                    <span className="truncate">{row.name}</span>
                    {row.imputed && <FlagMark reason={row.imputed} />}
                  </div>
                  <Num className="text-[11.5px]" style={{ color: "var(--text-lo)" }}>
                    {row.role} · {signed(row.bpm, 1)} bpm
                  </Num>
                </div>

                {/* Track */}
                <div className="relative" style={{ height: 22, minWidth: 0 }}>
                  {/* Model ceiling, drawn behind the bars. */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: `${(CEILING / DOMAIN) * 100}%`,
                      top: -4,
                      bottom: -4,
                      borderLeft: "1px dashed var(--rule-4)",
                    }}
                  />
                  {/* Current, solid. */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 6,
                      height: 10,
                      width: `${curPct}%`,
                      background: "var(--team)",
                      transformOrigin: "0% 50%",
                      transform: revealed || reduced ? "scaleX(1)" : "scaleX(0)",
                      transition: reduced
                        ? "none"
                        : `transform 480ms var(--ease-grow) ${index * 18}ms`,
                    }}
                  >
                    {hollow && (
                      <div
                        style={{
                          position: "absolute",
                          left: 2,
                          right: 2,
                          top: 4.5,
                          height: 1,
                          background: "var(--bg-base)",
                        }}
                      />
                    )}
                  </div>
                  {/* Optimal, an outlined target. Cased so it stays legible when it
                      falls inside the solid bar, which happens on 117 of 276 rows. */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: `${optPct}%`,
                      top: 1,
                      height: 20,
                      opacity: revealed || reduced ? 1 : 0,
                      transform: revealed || reduced ? "translateX(0)" : "translateX(-8px)",
                      transition: reduced
                        ? "none"
                        : `opacity 300ms var(--ease-out) ${index * 18 + 80}ms, transform 300ms var(--ease-out) ${
                            index * 18 + 80
                          }ms`,
                    }}
                  >
                    <svg width="9" height="20" style={{ display: "block", marginLeft: -1 }}>
                      <path
                        d="M 7 1 L 1 1 L 1 19 L 7 19"
                        fill="none"
                        stroke="var(--casing)"
                        strokeWidth={4}
                      />
                      <path
                        d="M 7 1 L 1 1 L 1 19 L 7 19"
                        fill="none"
                        stroke="var(--text-hi)"
                        strokeWidth={2}
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="hidden text-right sm:block">
                <DeltaLabel delta={row.delta} positive={positive} zero={zero} />
              </div>

              <div className="sm:hidden">
                <Num className="text-[11.5px]" style={{ color: "var(--text-lo)" }}>
                  {row.role} · {formatMinutes(row.cur)} → {formatMinutes(row.opt)} mpg
                </Num>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 max-w-[68ch] text-[13px] leading-[1.6]" style={{ color: "var(--text-lo)" }}>
        The model is linear, so its optima are extreme. Read the direction and the size of each
        delta — this player should play meaningfully more, that one meaningfully less — not the
        literal minutes.
      </p>
    </div>
  );
}

/**
 * Polarity is carried four ways: colour, sign glyph, caret, and the bar's own
 * direction. The value is the source `delta` field, never opt − cur — twelve of
 * the 276 rows disagree with the computed figure.
 */
function DeltaLabel({
  delta,
  positive,
  zero,
}: {
  delta: number;
  positive: boolean;
  zero: boolean;
}) {
  const color = zero ? "var(--text-lo)" : positive ? "var(--pos)" : "var(--neg)";
  const caret = zero ? "–" : positive ? "▲" : "▼";
  return (
    <Num className="text-[14.5px]" style={{ color }}>
      <span aria-hidden="true" style={{ fontSize: "0.8em" }}>
        {caret}
      </span>{" "}
      {zero ? `${FIGURE_SPACE}${delta.toFixed(1)}` : signed(delta, 1)}
    </Num>
  );
}
