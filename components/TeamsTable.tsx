"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import type { Team } from "@/lib/types";
import { fixed, formatMillions, signed } from "@/lib/format";
import { isAchromatic, teamIdentity } from "@/lib/teamColors";
import { useFlip, useReducedMotion, useReveal } from "@/lib/motion";
import { Money, Num } from "@/components/ui";

type SortKey =
  | "team"
  | "benchWinsAboveAvg"
  | "starterBPM"
  | "benchBPM"
  | "projWins"
  | "benchPayroll"
  | "costPerBenchWin";

type SortDir = "asc" | "desc";

const BAR_DOMAIN = 3; // fixed symmetric ±3.00, so the scale never rescales on re-sort
const BAR_HALF = 88;

export function TeamsTable({
  teams,
  onHoverTeam,
}: {
  teams: Team[];
  onHoverTeam?: (code: string | null) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("projWins");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTableSectionElement | null>(null);
  const reduced = useReducedMotion();
  const [revealRef, revealed] = useReveal<HTMLDivElement>();

  const sorted = useMemo(() => {
    const rows = [...teams];
    rows.sort((a, b) => {
      if (sortKey === "team") {
        const cmp = a.team.localeCompare(b.team);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const av = a[sortKey];
      const bv = b[sortKey];
      // Nulls always sort last, in both directions.
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = av - bv;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [teams, sortKey, sortDir]);

  // Biggest movers land last, which is what makes it read as sorting.
  const ranks = useRef<Map<string, number>>(new Map());
  const previousRanks = useRef<Map<string, number>>(new Map());
  previousRanks.current = ranks.current;
  ranks.current = new Map(sorted.map((t, i) => [t.team, i]));

  useFlip(bodyRef, `${sortKey}:${sortDir}`, {
    duration: 420,
    delay: (key) => {
      const before = previousRanks.current.get(key);
      const after = ranks.current.get(key);
      if (before === undefined || after === undefined) return 0;
      return Math.min(90, Math.abs(after - before) * 6);
    },
  });

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "team" ? "asc" : "desc");
    }
  }

  function setLive(code: string | null) {
    setHovered(code);
    onHoverTeam?.(code);
  }

  const firstNullIndex =
    sortKey === "costPerBenchWin"
      ? sorted.findIndex((t) => t.costPerBenchWin === null)
      : -1;

  const headCell = (key: SortKey, label: string, span?: number) => {
    const activeSort = sortKey === key;
    return (
      <th
        scope="col"
        colSpan={span}
        aria-sort={activeSort ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
        className="whitespace-nowrap px-3 py-2 text-right align-bottom"
        style={{ background: "var(--bg-panel)" }}
      >
        <button
          type="button"
          onClick={() => handleSort(key)}
          className="inline-flex items-center gap-1 text-[11.5px]"
          style={{
            fontWeight: 500,
            letterSpacing: "0.055em",
            color: activeSort ? "var(--text-hi)" : "var(--text-lo)",
            borderBottom: activeSort ? "1px solid var(--gold)" : "1px solid transparent",
            paddingBottom: 2,
          }}
        >
          {label}
          {activeSort && (
            <span aria-hidden="true" style={{ color: "var(--gold)" }}>
              {sortDir === "asc" ? "▲" : "▼"}
            </span>
          )}
        </button>
      </th>
    );
  };

  return (
    <div ref={revealRef}>
      <div className="overflow-x-auto" style={{ border: "1px solid var(--rule-2)" }}>
        <table
          className="w-full"
          style={{
            minWidth: 760,
            borderCollapse: "separate",
            borderSpacing: 0,
            tableLayout: "fixed",
            background: "var(--bg-panel)",
          }}
        >
          <colgroup>
            <col style={{ width: 24 }} />
            <col style={{ width: 76 }} />
            <col style={{ width: 84 }} />
            <col style={{ width: 176 }} />
            <col style={{ width: 92 }} />
            <col style={{ width: 92 }} />
            <col style={{ width: 84 }} />
            <col style={{ width: 108 }} />
            <col style={{ width: 128 }} />
          </colgroup>
          <thead>
            <tr style={{ position: "sticky", top: 0, zIndex: 3 }}>
              <th
                style={{
                  background: "var(--bg-panel)",
                  position: "sticky",
                  left: 0,
                  zIndex: 4,
                  borderBottom: "1px solid var(--rule-2)",
                }}
              >
                <span className="sr-only">Data flag</span>
              </th>
              <th
                scope="col"
                aria-sort={
                  sortKey === "team" ? (sortDir === "asc" ? "ascending" : "descending") : "none"
                }
                className="whitespace-nowrap px-3 py-2 text-left align-bottom"
                style={{
                  background: "var(--bg-panel)",
                  position: "sticky",
                  left: 24,
                  zIndex: 4,
                  borderBottom: "1px solid var(--rule-2)",
                  borderRight: "1px solid var(--rule-2)",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSort("team")}
                  className="inline-flex items-center gap-1 text-[11.5px]"
                  style={{
                    fontWeight: 500,
                    letterSpacing: "0.055em",
                    color: sortKey === "team" ? "var(--text-hi)" : "var(--text-lo)",
                    borderBottom:
                      sortKey === "team" ? "1px solid var(--gold)" : "1px solid transparent",
                    paddingBottom: 2,
                  }}
                >
                  Team
                  {sortKey === "team" && (
                    <span aria-hidden="true" style={{ color: "var(--gold)" }}>
                      {sortDir === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
              <>{headCell("benchWinsAboveAvg", "Bench wins vs average", 2)}</>
              <>{headCell("starterBPM", "Starter BPM")}</>
              <>{headCell("benchBPM", "Bench BPM")}</>
              <>{headCell("projWins", "Proj. wins")}</>
              <>{headCell("benchPayroll", "Bench payroll")}</>
              <>{headCell("costPerBenchWin", "Cost per bench win")}</>
            </tr>
          </thead>

          <tbody ref={bodyRef}>
            {sorted.map((team, index) => {
              const identity = teamIdentity(team.team);
              const hollow = isAchromatic(team.team);
              const live = hovered === team.team;
              const isExpanded = expanded === team.team;
              const rule = (index + 1) % 5 === 0 ? "var(--rule-2)" : "var(--rule-1)";
              const cell = {
                borderBottom: `1px solid ${rule}`,
                background: live ? "var(--bg-hover)" : "var(--bg-panel)",
              } as const;
              const width = Math.min(1, Math.abs(team.benchWinsAboveAvg) / BAR_DOMAIN) * BAR_HALF;
              const positive = team.benchWinsAboveAvg >= 0;

              return (
                <Fragment key={team.team}>
                  <tr
                    data-flip-key={team.team}
                    style={{ "--team": identity.color } as React.CSSProperties}
                    onPointerEnter={() => setLive(team.team)}
                    onPointerLeave={() => setLive(null)}
                    onFocus={() => setLive(team.team)}
                    onBlur={() => setLive(null)}
                  >
                    <td
                      className="text-center align-middle"
                      style={{
                        ...cell,
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        height: 44,
                      }}
                    >
                      {team.dataFlag && (
                        <button
                          type="button"
                          title={team.dataFlag}
                          aria-expanded={isExpanded}
                          aria-label={`Data flag for ${team.team}: ${team.dataFlag}`}
                          onClick={() =>
                            setExpanded((cur) => (cur === team.team ? null : team.team))
                          }
                          className="inline-flex h-6 w-6 items-center justify-center text-[9px] leading-none"
                          style={{ color: live ? "var(--text-lo)" : "var(--flag)" }}
                        >
                          {live ? "△" : "▲"}
                        </button>
                      )}
                    </td>

                    <td
                      className="px-3 align-middle"
                      style={{
                        ...cell,
                        position: "sticky",
                        left: 24,
                        zIndex: 2,
                        borderRight: "1px solid var(--rule-2)",
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          style={{
                            display: "inline-block",
                            width: hollow ? 3 : 2,
                            height: 22,
                            flex: "none",
                            background: live
                              ? hollow
                                ? "repeating-linear-gradient(to right, var(--team) 0 1px, transparent 1px 2px, var(--team) 2px 3px)"
                                : "var(--team)"
                              : "transparent",
                            transform: live ? "scaleY(1)" : "scaleY(0)",
                            transition: reduced ? "none" : "transform 120ms ease-out",
                          }}
                        />
                        <Num
                          className={`text-[13.5px] sm:text-[14.5px] ${live ? "team-text" : ""}`}
                          style={{ fontWeight: 500, color: live ? undefined : "var(--text-hi)" }}
                        >
                          {team.team}
                        </Num>
                      </span>
                    </td>

                    <td className="px-3 text-right align-middle" style={cell}>
                      <Num
                        className="text-[13.5px] sm:text-[14.5px]"
                        style={{ color: "var(--text-hi)" }}
                      >
                        {signed(team.benchWinsAboveAvg)}
                      </Num>
                    </td>

                    <td className="align-middle" style={cell}>
                      <div className="relative mx-auto" style={{ width: 176, height: 44 }}>
                        <div
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            left: BAR_HALF,
                            top: 0,
                            bottom: 0,
                            width: 1,
                            background: "var(--rule-3)",
                          }}
                        />
                        {/* Two spans anchored at the spine with opposite origins, so
                            growth is literally from the centre outward. */}
                        <div
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            left: BAR_HALF,
                            top: 18,
                            height: 8,
                            width: positive ? width : 0,
                            transformOrigin: "0% 50%",
                            transform: revealed || reduced ? "scaleX(1)" : "scaleX(0)",
                            background: "var(--pos)",
                            outline: live ? "1px solid var(--team)" : "none",
                            filter: live ? "brightness(1.08)" : "none",
                            transition: reduced
                              ? "none"
                              : `transform 560ms var(--ease-grow) ${index * 14}ms`,
                          }}
                        />
                        <div
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            left: BAR_HALF - (positive ? 0 : width),
                            top: 18,
                            height: 8,
                            width: positive ? 0 : width,
                            transformOrigin: "100% 50%",
                            transform: revealed || reduced ? "scaleX(1)" : "scaleX(0)",
                            background: "var(--neg)",
                            outline: live ? "1px solid var(--team)" : "none",
                            filter: live ? "brightness(1.08)" : "none",
                            transition: reduced
                              ? "none"
                              : `transform 560ms var(--ease-grow) ${index * 14}ms`,
                          }}
                        />
                      </div>
                    </td>

                    <td className="px-3 text-right align-middle" style={cell}>
                      <Num
                        className="text-[13.5px] sm:text-[14.5px]"
                        style={{ color: "var(--text-hi)" }}
                      >
                        {signed(team.starterBPM)}
                      </Num>
                    </td>
                    <td className="px-3 text-right align-middle" style={cell}>
                      <Num
                        className="text-[13.5px] sm:text-[14.5px]"
                        style={{ color: "var(--text-hi)" }}
                      >
                        {signed(team.benchBPM)}
                      </Num>
                    </td>
                    <td className="px-3 text-right align-middle" style={cell}>
                      <Num
                        className="text-[13.5px] sm:text-[14.5px]"
                        style={{ color: "var(--text-hi)" }}
                      >
                        {fixed(team.projWins, 1)}
                      </Num>
                    </td>
                    <td className="px-3 text-right align-middle" style={cell}>
                      <Money
                        className="text-[13.5px] sm:text-[14.5px]"
                        text={formatMillions(team.benchPayroll)}
                      />
                    </td>
                    <td className="px-3 text-right align-middle" style={cell}>
                      <Money
                        className="text-[13.5px] sm:text-[14.5px]"
                        text={formatMillions(team.costPerBenchWin)}
                      />
                    </td>
                  </tr>

                  {team.dataFlag && isExpanded && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-3 text-[12.5px] leading-[1.55]"
                        style={{
                          background: "var(--bg-overlay)",
                          borderBottom: "1px solid var(--rule-2)",
                          color: "var(--text-mid)",
                        }}
                      >
                        {team.dataFlag}
                      </td>
                    </tr>
                  )}

                  {index === firstNullIndex && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 text-[11.5px]"
                        style={{
                          height: 32,
                          borderTop: "1px solid var(--rule-2)",
                          borderBottom: "1px solid var(--rule-1)",
                          color: "var(--text-lo)",
                          background: "var(--bg-panel)",
                        }}
                      >
                        Undefined — the source records no cost per bench win for these fifteen
                        teams
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
