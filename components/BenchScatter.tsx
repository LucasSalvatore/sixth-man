"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Team } from "@/lib/types";
import { formatMillions, formatSurplus, signed } from "@/lib/format";
import { isAchromatic, teamIdentity } from "@/lib/teamColors";
import { useReducedMotion, useReveal } from "@/lib/motion";
import { useSelectedTeam } from "@/components/SelectedTeamProvider";
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

// Taller than a typical chart — this is the hero visual and takes the most space.
const WIDE: Geometry = { vbw: 1000, vbh: 600, x0: 64, x1: 980, y0: 30, y1: 540, r: 6 };
const COMPACT: Geometry = { vbw: 380, vbh: 480, x0: 44, x1: 366, y0: 22, y1: 430, r: 6 };

const X_DOMAIN: [number, number] = [8, 78];
const Y_DOMAIN: [number, number] = [-3.0, 2.2];
const X_TICKS = [10, 30, 50, 70];
const Y_TICKS = [-3, -2, -1, 0, 1, 2];

/** Only these five are annotated on the chart. Their labels never drop. */
const ANNOTATED = ["BOS", "POR", "DEN", "SAS", "BKN"];
const LABEL_OFFSET: Record<string, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  BOS: { dx: 12, dy: -2, anchor: "start" },
  POR: { dx: -12, dy: 2, anchor: "end" },
  SAS: { dx: 0, dy: -15, anchor: "middle" },
  DEN: { dx: 12, dy: 2, anchor: "start" },
  BKN: { dx: 0, dy: 20, anchor: "middle" },
};

function anchorTransform(anchor: string): string {
  if (anchor === "middle") return "translate(-50%, -50%)";
  if (anchor === "end") return "translate(-100%, -50%)";
  return "translate(0, -50%)";
}

export function BenchScatter({ teams }: { teams: Team[] }) {
  const [wide, setWide] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const [plotRef, revealed] = useReveal<HTMLDivElement>();
  const pointRefs = useRef<Map<string, SVGGElement>>(new Map());
  // Clicking (or Enter/Space on the focused point) selects that team for the
  // lineup optimizer and minutes plan below. This is a separate concern from
  // `active` (hover/focus preview) — a point can be actively hovered without
  // being the selected one, and vice versa.
  const { selected, setSelected } = useSelectedTeam();

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

  const ordered = useMemo(
    () => [...teams].sort((a, b) => a.benchPayroll - b.benchPayroll),
    [teams],
  );
  const byWins = useMemo(
    () => [...teams].sort((a, b) => a.benchWinsAboveAvg - b.benchWinsAboveAvg),
    [teams],
  );

  const activeTeam = active ? teams.find((t) => t.team === active) ?? null : null;

  const move = useCallback(
    (list: Team[], step: number) => {
      const from = active ?? ordered[0].team;
      const index = list.findIndex((t) => t.team === from);
      const next = list[Math.min(list.length - 1, Math.max(0, index + step))];
      if (!next) return;
      setActive(next.team);
      pointRefs.current.get(next.team)?.focus();
    },
    [active, ordered],
  );

  function onKeyDown(event: React.KeyboardEvent) {
    // Enter/Space select the currently focused point — keyboard parity with
    // clicking, since a focusable <g> has no native activation key of its own.
    if (event.key === "Enter" || event.key === " ") {
      if (active) {
        event.preventDefault();
        setSelected(active);
      }
      return;
    }

    const keys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowRight") move(ordered, 1);
    if (event.key === "ArrowLeft") move(ordered, -1);
    if (event.key === "ArrowUp") move(byWins, 1);
    if (event.key === "ArrowDown") move(byWins, -1);
    if (event.key === "Home") {
      setActive(ordered[0].team);
      pointRefs.current.get(ordered[0].team)?.focus();
    }
    if (event.key === "End") {
      const last = ordered[ordered.length - 1];
      setActive(last.team);
      pointRefs.current.get(last.team)?.focus();
    }
  }

  const zeroY = Y(0);
  const pct = (value: number, total: number) => `${(value / total) * 100}%`;

  /**
   * Resolves a pointer event to the team whose plotted CENTER is nearest the
   * actual cursor position, in SVG user-space — not whichever element the
   * browser's native hit-test happened to pick.
   *
   * This matters because the invisible tap targets are large enough to clear
   * the 32px mobile floor, and for closely-spaced teams (DET and OKC sit only
   * ~17 viewBox units — about 20px on a typical desktop width — apart) those
   * targets overlap. SVG paint order (ascending payroll) then decides which
   * element wins a native hit-test, which does not track which point the
   * click was actually closer to: it always favours whichever of the two
   * teams costs more, regardless of where the pointer landed. Resolving by
   * distance instead fixes clicking, and is reused for hover too, so the
   * tooltip and the click target can never disagree with each other.
   */
  const nearestTeamTo = useCallback(
    (event: { clientX: number; clientY: number; currentTarget: SVGGElement }, fallback: string): string => {
      const svg = event.currentTarget.ownerSVGElement;
      if (!svg) return fallback;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return fallback;
      const local = point.matrixTransform(ctm.inverse());
      let nearest = fallback;
      let nearestDistance = Infinity;
      for (const team of teams) {
        const cx = X(team.benchPayroll / 1_000_000);
        const cy = Y(team.benchWinsAboveAvg);
        const distance = (cx - local.x) ** 2 + (cy - local.y) ** 2;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = team.team;
        }
      }
      return nearest;
    },
    [teams, X, Y],
  );

  return (
    <div>
      <div className="mb-3">
        <MicroLabel>Bench wins above average</MicroLabel>
      </div>

      <div
        ref={plotRef}
        className="relative w-full"
        style={{
          aspectRatio: wide ? "1000 / 600" : "380 / 480",
          background: "var(--bg-raised)",
          border: "1px solid var(--rule-2)",
        }}
      >
        <svg
          viewBox={`0 0 ${g.vbw} ${g.vbh}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          role="application"
          aria-label="Bench payroll against bench wins above average, thirty teams. Use arrow keys to move between teams; left and right walk by payroll, up and down by bench value."
          onKeyDown={onKeyDown}
        >
          {Y_TICKS.map((t) => (
            <line
              key={`gy${t}`}
              x1={g.x0}
              x2={g.x1}
              y1={Y(t)}
              y2={Y(t)}
              stroke="var(--rule-1)"
              strokeWidth={1}
              strokeDasharray={t === 0 ? undefined : "1 4"}
            />
          ))}

          {/* Zero line: a real anchor (a league-average bench), not a computed mean. */}
          <line
            x1={g.x0}
            x2={g.x1}
            y1={zeroY}
            y2={zeroY}
            stroke="var(--rule-4)"
            strokeWidth={1}
            strokeDasharray="6 5"
          />

          <line x1={g.x0} x2={g.x0} y1={g.y0} y2={g.y1} stroke="var(--rule-4)" strokeWidth={1} />
          <line x1={g.x0} x2={g.x1} y1={g.y1} y2={g.y1} stroke="var(--rule-4)" strokeWidth={1} />
          {X_TICKS.map((t) => (
            <line key={`tx${t}`} x1={X(t)} x2={X(t)} y1={g.y1} y2={g.y1 + 5} stroke="var(--rule-4)" strokeWidth={1} />
          ))}

          {/* Crosshair to both axes for the live point. */}
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
            </g>
          )}

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
                  data-team={team.team}
                  tabIndex={isActive || (active === null && index === 0) ? 0 : -1}
                  role="img"
                  aria-label={`${identity.name}. Bench payroll ${formatMillions(
                    team.benchPayroll,
                  )}. Bench wins above average ${signed(team.benchWinsAboveAvg, 1)}. Surplus value ${formatSurplus(
                    team.benchSurplusValue,
                  )}.${
                    team.team === selected
                      ? " Selected — driving the lineup optimizer and minutes plan below."
                      : " Press Enter to select for the lineup optimizer and minutes plan below."
                  }`}
                  style={
                    {
                      "--team": identity.color,
                      cursor: "pointer",
                      opacity: show ? (dim ? 0.32 : 1) : 0,
                      transform: show ? "scale(1)" : "scale(0.4)",
                      transformOrigin: `${cx}px ${cy}px`,
                      transition: reduced
                        ? "none"
                        : `opacity 420ms var(--ease-out) ${revealed ? index * 12 : 0}ms, transform 420ms var(--ease-out) ${revealed ? index * 12 : 0}ms`,
                    } as React.CSSProperties
                  }
                  onPointerEnter={(event) => setActive(nearestTeamTo(event, team.team))}
                  onPointerLeave={() => setActive((cur) => (cur === team.team ? null : cur))}
                  onFocus={() => setActive(team.team)}
                  onBlur={() => setActive((cur) => (cur === team.team ? null : cur))}
                  onClick={(event) => {
                    const resolved = nearestTeamTo(event, team.team);
                    setActive(resolved);
                    setSelected(resolved);
                  }}
                >
                  {/* Invisible tap/hit target. r=18.5 viewBox units renders at
                      33.2 CSS px at a 375px viewport (compact viewBox 380 wide
                      inside a 341px container), clearing the 32px floor. r=17
                      measured 30.5px and missed it. */}
                  <circle cx={cx} cy={cy} r={18.5} fill="transparent" />
                  {/* Persistent selection ring — distinct from the transient
                      hover/focus ring below, and independent of it: a point can
                      be selected without being hovered, or hovered without
                      being the selected one. */}
                  {team.team === selected && (
                    <circle cx={cx} cy={cy} r={11} fill="none" stroke="var(--team)" strokeWidth={1.5} />
                  )}
                  {isActive && (
                    <circle cx={cx} cy={cy} r={13} fill="none" stroke="var(--team)" strokeWidth={1} />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isActive ? 8.5 : g.r}
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

        {/* HTML overlays: sizes locked in CSS px, independent of viewBox scale. */}
        {X_TICKS.map((t) => (
          <div
            key={`lx${t}`}
            className="halo absolute text-[11px]"
            style={{
              left: pct(X(t), g.vbw),
              top: pct(g.y1 + 16, g.vbh),
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
            className="halo absolute text-[11px]"
            style={{
              left: pct(g.x0 - 9, g.vbw),
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
          className="halo absolute text-[11px]"
          style={{
            left: pct(g.x1, g.vbw),
            top: pct(zeroY - 12, g.vbh),
            transform: "translate(-100%, -50%)",
            fontFamily: "var(--font-body)",
            fontStyle: "italic",
            color: "var(--text-lo)",
            whiteSpace: "nowrap",
          }}
        >
          League-average bench
        </div>

        {/* The five annotated teams — labels never drop, at any size. */}
        {ANNOTATED.map((code) => {
          const team = teams.find((t) => t.team === code);
          if (!team) return null;
          const { dx, dy, anchor } = LABEL_OFFSET[code];
          const identity = teamIdentity(code);
          const live = active === code;
          return (
            <div
              key={`ann${code}`}
              className={`halo absolute text-[11.5px] ${live ? "team-text" : ""}`}
              style={
                {
                  left: pct(X(team.benchPayroll / 1_000_000) + dx, g.vbw),
                  top: pct(Y(team.benchWinsAboveAvg) + dy, g.vbh),
                  transform: anchorTransform(anchor),
                  fontFamily: "var(--font-num)",
                  fontWeight: 500,
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

        {/* Desktop: floating tooltip. */}
        {wide && activeTeam && (
          <div
            className="pointer-events-none absolute z-10 w-[232px] p-3"
            style={{
              left: pct(X(activeTeam.benchPayroll / 1_000_000), g.vbw),
              top: pct(Y(activeTeam.benchWinsAboveAvg), g.vbh),
              transform:
                X(activeTeam.benchPayroll / 1_000_000) > g.vbw * 0.62
                  ? "translate(calc(-100% - 18px), -50%)"
                  : "translate(18px, -50%)",
              background: "var(--bg-overlay)",
              border: "1px solid var(--rule-2)",
            }}
          >
            <TooltipBody team={activeTeam} />
          </div>
        )}
      </div>

      <div className="mt-3 text-center">
        <MicroLabel>Bench payroll ($m)</MicroLabel>
      </div>

      {/* Mobile: a fixed detail card below the chart (hover does not exist on touch). */}
      {!wide && (
        <div
          className="mt-4 min-h-[92px] p-4"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--rule-2)" }}
        >
          {activeTeam ? (
            <TooltipBody team={activeTeam} />
          ) : (
            <span className="text-[13px]" style={{ color: "var(--text-lo)" }}>
              Tap a point to see the team, its payroll, its bench value, and its surplus.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function TooltipBody({ team }: { team: Team }) {
  const identity = teamIdentity(team.team);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14.5px]" style={{ fontWeight: 600, color: "var(--text-hi)" }}>
          {identity.name}
        </span>
        <Num
          className="text-[11.5px] team-text"
          style={{ "--team": identity.color } as React.CSSProperties}
        >
          {team.team}
        </Num>
      </div>
      <dl className="mt-3 flex flex-col gap-1.5">
        <Row label="Bench payroll">
          <Num style={{ color: "var(--text-hi)" }}>{formatMillions(team.benchPayroll)}</Num>
        </Row>
        <Row label="Wins above average">
          <Num style={{ color: "var(--text-hi)" }}>{signed(team.benchWinsAboveAvg, 1)}</Num>
        </Row>
        <Row label="Surplus value">
          <Num style={{ color: team.benchSurplusValue < 0 ? "var(--neg)" : "var(--pos)" }}>
            {formatSurplus(team.benchSurplusValue)}
          </Num>
        </Row>
      </dl>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[14px]">
      <MicroLabel>{label}</MicroLabel>
      {children}
    </div>
  );
}
