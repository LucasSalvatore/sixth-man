"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Team } from "@/lib/types";
import { formatMillions, signed } from "@/lib/format";
import { isAchromatic, teamIdentity } from "@/lib/teamColors";
import { useReducedMotion, useReveal } from "@/lib/motion";
import { MicroLabel, Num } from "@/components/ui";

type Geometry = {
  vbw: number;
  vbh: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  r: number;
};

const WIDE: Geometry = { vbw: 1000, vbh: 560, x0: 68, x1: 976, y0: 26, y1: 506, r: 5.5 };
const COMPACT: Geometry = { vbw: 600, vbh: 720, x0: 52, x1: 580, y0: 24, y1: 672, r: 5 };

const X_DOMAIN: [number, number] = [8, 78];
const Y_DOMAIN: [number, number] = [-3.2, 2.4];
const X_TICKS = [10, 20, 30, 40, 50, 60, 70];
const Y_TICKS = [-3, -2, -1, 0, 1, 2];

/** Label offsets verified collision-free against every point at both breakpoints. */
const LABELS: Record<string, { wide: [number, number, string]; compact: [number, number, string] }> = {
  DEN: { wide: [11, 4, "start"], compact: [10, 4, "start"] },
  GSW: { wide: [0, -13, "middle"], compact: [0, -12, "middle"] },
  BKN: { wide: [0, -13, "middle"], compact: [0, -12, "middle"] },
  BOS: { wide: [11, 4, "start"], compact: [10, 4, "start"] },
  SAS: { wide: [0, -13, "middle"], compact: [0, -12, "middle"] },
  POR: { wide: [-11, 4, "end"], compact: [-10, 4, "end"] },
};

function anchorTransform(anchor: string): string {
  if (anchor === "middle") return "translate(-50%, -50%)";
  if (anchor === "end") return "translate(-100%, -50%)";
  return "translate(0, -50%)";
}

export function BenchScatter({
  teams,
  leagueAveragePayroll,
  onHoverTeam,
}: {
  teams: Team[];
  leagueAveragePayroll: number;
  onHoverTeam?: (code: string | null) => void;
}) {
  const [wide, setWide] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const [plotRef, revealed] = useReveal<HTMLDivElement>();
  const pointRefs = useRef<Map<string, SVGGElement>>(new Map());

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const g = wide ? WIDE : COMPACT;
  const X = useCallback(
    (v: number) => g.x0 + ((v - X_DOMAIN[0]) / (X_DOMAIN[1] - X_DOMAIN[0])) * (g.x1 - g.x0),
    [g],
  );
  const Y = useCallback(
    (v: number) => g.y1 - ((v - Y_DOMAIN[0]) / (Y_DOMAIN[1] - Y_DOMAIN[0])) * (g.y1 - g.y0),
    [g],
  );

  /** Ascending payroll — the render order, the entry-sweep order, and the arrow-key order. */
  const ordered = useMemo(
    () => [...teams].sort((a, b) => a.benchPayroll - b.benchPayroll),
    [teams],
  );
  const byWins = useMemo(
    () => [...teams].sort((a, b) => a.benchWinsAboveAvg - b.benchWinsAboveAvg),
    [teams],
  );

  const activeTeam = active ? teams.find((t) => t.team === active) ?? null : null;

  const setActiveTeam = useCallback(
    (code: string | null) => {
      setActive(code);
      onHoverTeam?.(code);
    },
    [onHoverTeam],
  );

  const move = useCallback(
    (list: Team[], step: number) => {
      const from = active ?? ordered[0].team;
      const index = list.findIndex((t) => t.team === from);
      const next = list[Math.min(list.length - 1, Math.max(0, index + step))];
      if (!next) return;
      setActiveTeam(next.team);
      pointRefs.current.get(next.team)?.focus();
    },
    [active, ordered, setActiveTeam],
  );

  function onKeyDown(event: React.KeyboardEvent) {
    const keys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowRight") move(ordered, 1);
    if (event.key === "ArrowLeft") move(ordered, -1);
    if (event.key === "ArrowUp") move(byWins, 1);
    if (event.key === "ArrowDown") move(byWins, -1);
    if (event.key === "Home") {
      setActiveTeam(ordered[0].team);
      pointRefs.current.get(ordered[0].team)?.focus();
    }
    if (event.key === "End") {
      const last = ordered[ordered.length - 1];
      setActiveTeam(last.team);
      pointRefs.current.get(last.team)?.focus();
    }
  }

  const meanX = X(leagueAveragePayroll / 1_000_000);
  const zeroY = Y(0);
  const pct = (value: number, total: number) => `${(value / total) * 100}%`;

  return (
    <div>
      <p className="mb-6 max-w-[62ch] text-[15.5px] leading-[1.55] sm:text-[17px]">
        <strong style={{ color: "var(--text-hi)", fontWeight: 600 }}>
          Bench spending barely predicts bench quality.
        </strong>{" "}
        Boston bought the league&apos;s best bench for $26.4m. Portland spent $74.0m — more than
        anyone — and got +0.29.
      </p>

      <div className="mb-2">
        <MicroLabel>Bench wins above average</MicroLabel>
      </div>

      <div
        ref={plotRef}
        className="relative w-full"
        style={{
          aspectRatio: wide ? "25 / 14" : "5 / 6",
          background: "var(--bg-raised)",
          border: "1px solid var(--rule-2)",
        }}
      >
        <svg
          viewBox={`0 0 ${g.vbw} ${g.vbh}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          role="application"
          aria-label="Bench payroll against bench wins above average, thirty teams. Use arrow keys to move between teams."
          onKeyDown={onKeyDown}
        >
          {/* Horizontal gridlines only. */}
          {Y_TICKS.map((t) => (
            <line
              key={`gy${t}`}
              x1={g.x0}
              x2={g.x1}
              y1={Y(t)}
              y2={Y(t)}
              stroke="var(--rule-1)"
              strokeWidth={1}
              strokeDasharray="1 3"
            />
          ))}

          {/* Mandated quadrant lines. Dashing does the recessive work, not value. */}
          <line
            x1={meanX}
            x2={meanX}
            y1={g.y0}
            y2={g.y1}
            stroke="var(--rule-4)"
            strokeWidth={1}
            strokeDasharray="6 5"
          />
          <line
            x1={g.x0}
            x2={g.x1}
            y1={zeroY}
            y2={zeroY}
            stroke="var(--rule-4)"
            strokeWidth={1}
            strokeDasharray="6 5"
          />

          {/* Axes */}
          <line x1={g.x0} x2={g.x0} y1={g.y0} y2={g.y1} stroke="var(--rule-4)" strokeWidth={1} />
          <line x1={g.x0} x2={g.x1} y1={g.y1} y2={g.y1} stroke="var(--rule-4)" strokeWidth={1} />
          {X_TICKS.map((t) => (
            <line
              key={`tx${t}`}
              x1={X(t)}
              x2={X(t)}
              y1={g.y1}
              y2={g.y1 + 5}
              stroke="var(--rule-4)"
              strokeWidth={1}
            />
          ))}
          {Y_TICKS.map((t) => (
            <line
              key={`ty${t}`}
              x1={g.x0 - 5}
              x2={g.x0}
              y1={Y(t)}
              y2={Y(t)}
              stroke="var(--rule-4)"
              strokeWidth={1}
            />
          ))}

          {/* Crosshairs from the live point to both axes. */}
          {activeTeam && (
            <g pointerEvents="none">
              <line
                x1={X(activeTeam.benchPayroll / 1_000_000)}
                x2={X(activeTeam.benchPayroll / 1_000_000)}
                y1={Y(activeTeam.benchWinsAboveAvg)}
                y2={g.y1}
                stroke="var(--rule-4)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <line
                x1={g.x0}
                x2={X(activeTeam.benchPayroll / 1_000_000)}
                y1={Y(activeTeam.benchWinsAboveAvg)}
                y2={Y(activeTeam.benchWinsAboveAvg)}
                stroke="var(--rule-4)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <line
                x1={X(activeTeam.benchPayroll / 1_000_000)}
                x2={X(activeTeam.benchPayroll / 1_000_000)}
                y1={g.y1}
                y2={g.y1 + 8}
                stroke="var(--rule-4)"
                strokeWidth={2}
              />
              <line
                x1={g.x0 - 8}
                x2={g.x0}
                y1={Y(activeTeam.benchWinsAboveAvg)}
                y2={Y(activeTeam.benchWinsAboveAvg)}
                stroke="var(--rule-4)"
                strokeWidth={2}
              />
            </g>
          )}

          {/* Points, drawn in ascending payroll order. */}
          <g>
            {ordered.map((team, index) => {
              const identity = teamIdentity(team.team);
              const hollow = isAchromatic(team.team);
              const cx = X(team.benchPayroll / 1_000_000);
              const cy = Y(team.benchWinsAboveAvg);
              const isActive = active === team.team;
              const dim = active !== null && !isActive;
              const show = revealed || reduced;

              return (
                <g
                  key={team.team}
                  ref={(node) => {
                    if (node) pointRefs.current.set(team.team, node);
                    else pointRefs.current.delete(team.team);
                  }}
                  tabIndex={active === team.team || (active === null && index === 0) ? 0 : -1}
                  role="img"
                  aria-label={`${identity.name}. Bench payroll ${formatMillions(
                    team.benchPayroll,
                  )}. Bench wins above average ${team.benchWinsAboveAvg < 0 ? "minus" : "plus"} ${Math.abs(
                    team.benchWinsAboveAvg,
                  ).toFixed(2)}.`}
                  style={
                    {
                      "--team": identity.color,
                      cursor: "pointer",
                      opacity: show ? (dim ? 0.35 : 1) : 0,
                      transform: show ? "scale(1)" : "scale(0.4)",
                      transformOrigin: `${cx}px ${cy}px`,
                      transition: reduced
                        ? "none"
                        : `opacity 420ms var(--ease-out) ${revealed ? index * 12 : 0}ms, transform 420ms var(--ease-out) ${
                            revealed ? index * 12 : 0
                          }ms`,
                    } as React.CSSProperties
                  }
                  onPointerEnter={() => setActiveTeam(team.team)}
                  onPointerLeave={() => setActiveTeam(null)}
                  onFocus={() => setActiveTeam(team.team)}
                  onBlur={() => setActiveTeam(null)}
                >
                  {isActive && (
                    <circle cx={cx} cy={cy} r={13} fill="none" stroke="var(--team)" strokeWidth={1} />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isActive ? 8 : g.r}
                    fill={hollow ? "var(--bg-base)" : "var(--team)"}
                    stroke={hollow ? "var(--team)" : "none"}
                    strokeWidth={hollow ? 2.5 : 0}
                    style={{ transition: reduced ? "none" : "r 140ms ease-out" }}
                  />
                </g>
              );
            })}
          </g>
        </svg>

        {/* All text is HTML, so its size is locked in CSS px regardless of viewBox scale. */}
        {X_TICKS.map((t) => (
          <div
            key={`lx${t}`}
            className="halo absolute text-[11.5px]"
            style={{
              left: pct(X(t), g.vbw),
              top: pct(g.y1 + 18, g.vbh),
              transform: "translate(-50%, -50%)",
              fontFamily: "var(--font-num)",
              color: "var(--text-lo)",
            }}
          >
            {`$${t}m`}
          </div>
        ))}
        {Y_TICKS.map((t) => (
          <div
            key={`ly${t}`}
            className="halo absolute text-[11.5px]"
            style={{
              left: pct(g.x0 - 10, g.vbw),
              top: pct(Y(t), g.vbh),
              transform: "translate(-100%, -50%)",
              fontFamily: "var(--font-num)",
              color: "var(--text-lo)",
            }}
          >
            {t > 0 ? `+${t}` : t < 0 ? `−${Math.abs(t)}` : "0"}
          </div>
        ))}

        <div
          className="halo absolute text-[11.5px]"
          style={{
            left: pct(meanX + 8, g.vbw),
            top: pct(g.y0 + 10, g.vbh),
            fontFamily: "var(--font-num)",
            color: "var(--text-lo)",
            whiteSpace: "nowrap",
          }}
        >
          League average {formatMillions(leagueAveragePayroll)}
        </div>

        <div
          className="halo absolute text-[13.5px] sm:text-[15px]"
          style={{
            left: pct(wide ? 78 : 62, g.vbw),
            top: pct(wide ? 44 : 42, g.vbh),
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            color: "var(--text-lo)",
            whiteSpace: "nowrap",
          }}
        >
          Cheap and good
        </div>
        <div
          className="halo absolute text-[13.5px] sm:text-[15px]"
          style={{
            left: pct(wide ? 966 : 570, g.vbw),
            top: pct(wide ? 492 : 658, g.vbh),
            transform: "translate(-100%, -50%)",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            color: "var(--text-lo)",
            whiteSpace: "nowrap",
          }}
        >
          Expensive and weak
        </div>

        {/* The six notable teams, labelled at both breakpoints — nothing is dropped at 375px. */}
        {Object.entries(LABELS).map(([code, offsets]) => {
          const team = teams.find((t) => t.team === code);
          if (!team) return null;
          const [dx, dy, anchor] = wide ? offsets.wide : offsets.compact;
          const identity = teamIdentity(code);
          const live = active === code;
          return (
            <div
              key={`lbl${code}`}
              className={`halo absolute text-[11.5px] ${live ? "team-text" : ""}`}
              style={
                {
                  left: pct(X(team.benchPayroll / 1_000_000) + dx, g.vbw),
                  top: pct(Y(team.benchWinsAboveAvg) + dy, g.vbh),
                  transform: anchorTransform(anchor),
                  fontFamily: "var(--font-num)",
                  color: live ? undefined : "var(--text-hi)",
                  "--team": identity.color,
                  pointerEvents: "none",
                } as React.CSSProperties
              }
            >
              {code}
            </div>
          );
        })}

        {/* Axis readouts — the chart reads its own value off both scales. */}
        {activeTeam && (
          <>
            <div
              className="halo absolute text-[11.5px] team-text"
              style={
                {
                  left: pct(X(activeTeam.benchPayroll / 1_000_000), g.vbw),
                  top: pct(g.y1 + 18, g.vbh),
                  transform: "translate(-50%, -50%)",
                  fontFamily: "var(--font-num)",
                  "--team": teamIdentity(activeTeam.team).color,
                } as React.CSSProperties
              }
            >
              {formatMillions(activeTeam.benchPayroll)}
            </div>
            <div
              className="halo absolute text-[11.5px] team-text"
              style={
                {
                  left: pct(g.x0 - 10, g.vbw),
                  top: pct(Y(activeTeam.benchWinsAboveAvg), g.vbh),
                  transform: "translate(-100%, -50%)",
                  fontFamily: "var(--font-num)",
                  "--team": teamIdentity(activeTeam.team).color,
                } as React.CSSProperties
              }
            >
              {signed(activeTeam.benchWinsAboveAvg)}
            </div>
          </>
        )}

        {/* Tooltip */}
        {activeTeam && (
          <div
            className="pointer-events-none absolute z-10 w-[240px] p-3"
            style={{
              left: pct(X(activeTeam.benchPayroll / 1_000_000), g.vbw),
              top: pct(Y(activeTeam.benchWinsAboveAvg), g.vbh),
              transform:
                X(activeTeam.benchPayroll / 1_000_000) > g.vbw * 0.6
                  ? "translate(calc(-100% - 18px), -50%)"
                  : "translate(18px, -50%)",
              background: "var(--bg-overlay)",
              border: "1px solid var(--rule-2)",
            }}
          >
            <div className="text-[14.5px]" style={{ fontWeight: 500, color: "var(--text-hi)" }}>
              {teamIdentity(activeTeam.team).name}
            </div>
            <Num
              className="text-[11.5px] team-text"
              style={{ "--team": teamIdentity(activeTeam.team).color } as React.CSSProperties}
            >
              {activeTeam.team}
            </Num>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <MicroLabel>Bench payroll</MicroLabel>
              <Num className="text-[14.5px]" style={{ color: "var(--text-hi)" }}>
                {formatMillions(activeTeam.benchPayroll)}
              </Num>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <MicroLabel>Wins above average</MicroLabel>
              <Num className="text-[14.5px]" style={{ color: "var(--text-hi)" }}>
                {signed(activeTeam.benchWinsAboveAvg)}
              </Num>
            </div>
            {activeTeam.dataFlag && (
              <div
                className="mt-3 pt-2 text-[12.5px]"
                style={{ borderTop: "1px solid var(--rule-2)", color: "var(--text-lo)" }}
              >
                <span style={{ color: "var(--flag)" }}>▲</span> Data flag — see the table
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 text-center">
        <MicroLabel>Bench payroll ($m)</MicroLabel>
      </div>
    </div>
  );
}
