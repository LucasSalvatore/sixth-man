import type { MinutesRow } from "@/lib/types";
import { FIGURE_SPACE, fixed, formatMinutes, signed } from "@/lib/format";
import { isAchromatic, teamIdentity } from "@/lib/teamColors";
import { FlagMark } from "@/components/flags";
import { Num } from "@/components/ui";

/** A geometry domain only; it does not produce a displayed statistic. */
const DOMAIN = 44;

function OptimalMark() {
  return (
    <svg aria-hidden="true" width="9" height="20" style={{ display: "block", marginLeft: -1 }}>
      <path d="M 7 1 L 1 1 L 1 19 L 7 19" fill="none" stroke="var(--casing)" strokeWidth={4} />
      <path d="M 7 1 L 1 1 L 1 19 L 7 19" fill="none" stroke="var(--text-hi)" strokeWidth={2} />
    </svg>
  );
}

export function MinutesPlan({ code, rows, ceiling }: { code: string; rows: MinutesRow[]; ceiling: number }) {
  const identity = teamIdentity(code);
  const hollow = isAchromatic(code);
  const sorted = [...rows].sort((a, b) => b.opt - a.opt || b.cur - a.cur || b.bpm - a.bpm || a.name.localeCompare(b.name));

  return (
    <div data-minutes-panel={code} style={{ "--team": identity.color } as React.CSSProperties}>
      <h3 className="mb-4 text-[20px]" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--text-hi)" }}>{identity.name}</h3>
      <ul aria-label="Minutes plan legend" className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px]" style={{ color: "var(--text-mid)" }}>
        <li className="flex min-h-8 items-center gap-2">
          <span aria-hidden="true" className="relative inline-block h-[10px] w-7" style={{ background: "var(--team)" }}>
            {hollow && <span className="absolute inset-x-0.5 top-1 h-px" style={{ background: "var(--bg-base)" }} />}
          </span>
          Current minutes
        </li>
        <li className="flex min-h-8 items-center gap-2"><OptimalMark />Optimal minutes</li>
        <li className="flex min-h-8 items-center gap-2">
          <span aria-hidden="true" className="inline-block h-5" style={{ borderLeft: "1px dashed var(--rule-4)" }} />
          <span>Model ceiling <Num>{formatMinutes(ceiling)}</Num></span>
        </li>
      </ul>
      <div className="flex flex-col gap-2">
        {sorted.map((row) => {
          const curPct = (row.cur / DOMAIN) * 100;
          const optPct = (row.opt / DOMAIN) * 100;
          return (
            <div
              key={row.name}
              data-minutes-player={row.name}
              className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-x-3 gap-y-2 px-3 py-3 sm:grid-cols-[220px_minmax(0,1fr)_92px] sm:gap-x-4"
              style={{ background: "var(--bg-raised)", borderBottom: "1px solid var(--rule-1)" }}
            >
              <div className="min-w-0">
                <div className="flex items-start gap-2 text-[15px] leading-snug" style={{ fontWeight: 500, color: "var(--text-hi)" }}>
                  <span data-player-name className="min-w-0 break-words">{row.name}</span>
                  {row.imputed && <FlagMark reason={row.imputed} />}
                </div>
                <p className="mt-1 text-[12px]" style={{ color: "var(--text-lo)" }}>{row.role} · <Num>{signed(row.bpm, 1)}</Num> BPM</p>
              </div>
              <div className="col-start-2 row-start-1 text-right sm:col-start-3"><DeltaLabel delta={row.delta} /></div>
              {/* Bars are fully rendered on the server, including with JS off. */}
              <div className="relative col-span-2 h-[22px] min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1" aria-hidden="true">
                <div style={{ position: "absolute", left: `${(ceiling / DOMAIN) * 100}%`, top: -4, bottom: -4, borderLeft: "1px dashed var(--rule-4)" }} />
                <div data-minutes-current style={{ position: "absolute", left: 0, top: 6, height: 10, width: `${curPct}%`, background: "var(--team)" }}>
                  {hollow && <div style={{ position: "absolute", left: 2, right: 2, top: 4.5, height: 1, background: "var(--bg-base)" }} />}
                </div>
                <div data-minutes-optimal style={{ position: "absolute", left: `${optPct}%`, top: 1, height: 20 }}><OptimalMark /></div>
              </div>
              <p className="col-span-2 text-[12px] sm:col-span-3" style={{ color: "var(--text-lo)" }}>
                <Num>{formatMinutes(row.cur)} → {formatMinutes(row.opt)}</Num> mpg
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-6 max-w-[68ch] text-[15px] leading-relaxed" style={{ color: "var(--text-lo)" }}>
        The model is linear, so its optima are extreme. Read the direction and the size of each delta — this player should play meaningfully more, that one meaningfully less — not the literal minutes.
      </p>
    </div>
  );
}

/** Delta is a field read; do not recompute it from optimal minus current. */
function DeltaLabel({ delta }: { delta: number }) {
  const zero = delta === 0;
  const positive = delta > 0;
  const color = zero ? "var(--text-lo)" : positive ? "var(--pos)" : "var(--neg)";
  return (
    <Num className="text-[15px]" style={{ color }}>
      <span aria-hidden="true" className="text-[12px]">{zero ? "–" : positive ? "▲" : "▼"}</span>{" "}
      {zero ? `${FIGURE_SPACE}${fixed(delta, 1)}` : signed(delta, 1)}
    </Num>
  );
}
