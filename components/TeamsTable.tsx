"use client";

import { Fragment, useCallback, useMemo, useRef, useState } from "react";
import type { ImputeReason, Team } from "@/lib/types";
import { fixed, formatMillions, formatSurplus, signed } from "@/lib/format";
import { isAchromatic, teamIdentity } from "@/lib/teamColors";
import { useFlip, useReducedMotion, useReveal } from "@/lib/motion";
import { REASON_META, FlagDetails } from "@/components/flags";
import { Money, Num } from "@/components/ui";

type SortKey =
  | "team"
  | "benchWinsAboveAvg"
  | "starterBPM"
  | "benchBPM"
  | "projWins"
  | "benchPayroll"
  | "benchSurplusValue";

type SortDir = "asc" | "desc";

const BAR_DOMAIN = 3; // fixed symmetric ±3.00 (extreme is BKN −2.65), never rescales
const BAR_HALF = 88;

/** The reasons present on a team, deduped, so the gutter shows what kind(s) of
 *  imputation the row carries at a glance; the expansion lists every player. */
function reasonsOf(team: Team): ImputeReason[] {
  const seen = new Set<ImputeReason>();
  for (const flag of team.dataFlags) seen.add(flag.reason);
  return [...seen];
}

export function TeamsTable({
  teams,
  onHoverTeam,
}: {
  teams: Team[];
  onHoverTeam?: (code: string | null) => void;
}) {
  // Default: surplus value descending; ties broken by projected wins descending.
  const [sortKey, setSortKey] = useState<SortKey>("benchSurplusValue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTableSectionElement | null>(null);
  const reduced = useReducedMotion();
  const [revealRef, revealed] = useReveal<HTMLDivElement>();

  const sorted = useMemo(() => {
    const rows = [...teams];
    rows.sort((a, b) => {
      let cmp: number;
      if (sortKey === "team") {
        cmp = a.team.localeCompare(b.team);
        return sortDir === "asc" ? cmp : -cmp;
      }
      cmp = a[sortKey] - b[sortKey];
      const primary = sortDir === "asc" ? cmp : -cmp;
      if (primary !== 0) return primary;
      // Deterministic tiebreak so re-sorts never reorder ties randomly.
      return b.projWins - a.projWins || a.team.localeCompare(b.team);
    });
    return rows;
  }, [teams, sortKey, sortDir]);

  const ranks = useRef<Map<string, number>>(new Map());
  const previousRanks = useRef<Map<string, number>>(new Map());
  previousRanks.current = ranks.current;
  ranks.current = new Map(sorted.map((t, i) => [t.team, i]));

  // Stable across renders: it only reads .current at call time, so it never
  // forces useFlip's layout effect to re-run outside of an actual sort change.
  // An inline arrow function here previously got a new identity every render
  // (including on every row hover), making the effect re-measure and
  // potentially re-animate all 30 rows on interactions that have nothing to
  // do with sorting.
  const flipDelay = useCallback((key: string) => {
    const before = previousRanks.current.get(key);
    const after = ranks.current.get(key);
    if (before === undefined || after === undefined) return 0;
    return Math.min(90, Math.abs(after - before) * 6);
  }, []);

  useFlip(bodyRef, `${sortKey}:${sortDir}`, {
    duration: 420,
    delay: flipDelay,
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
            letterSpacing: "0.04em",
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
            minWidth: 780,
            borderCollapse: "separate",
            borderSpacing: 0,
            tableLayout: "fixed",
            background: "var(--bg-panel)",
          }}
        >
          <colgroup>
            <col style={{ width: 30 }} />
            <col style={{ width: 76 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 176 }} />
            <col style={{ width: 92 }} />
            <col style={{ width: 92 }} />
            <col style={{ width: 84 }} />
            <col style={{ width: 108 }} />
            <col style={{ width: 120 }} />
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
                <span className="sr-only">Data flags</span>
              </th>
              <th
                scope="col"
                aria-sort={sortKey === "team" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                className="whitespace-nowrap px-3 py-2 text-left align-bottom"
                style={{
                  background: "var(--bg-panel)",
                  position: "sticky",
                  left: 30,
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
                    letterSpacing: "0.04em",
                    color: sortKey === "team" ? "var(--text-hi)" : "var(--text-lo)",
                    borderBottom: sortKey === "team" ? "1px solid var(--gold)" : "1px solid transparent",
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
              <>{headCell("benchSurplusValue", "Surplus value")}</>
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
              const reasons = reasonsOf(team);
              const surplusNeg = team.benchSurplusValue < 0;

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
                      style={{ ...cell, position: "sticky", left: 0, zIndex: 2, height: 44 }}
                    >
                      {reasons.length > 0 && (
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-label={`${team.dataFlags.length} imputed player${
                            team.dataFlags.length === 1 ? "" : "s"
                          } for ${team.team}. Activate to show details.`}
                          onClick={() => setExpanded((cur) => (cur === team.team ? null : team.team))}
                          className="inline-flex h-6 items-center justify-center gap-0.5 leading-none"
                        >
                          {reasons.map((reason) => (
                            <span
                              key={reason}
                              aria-hidden="true"
                              className="text-[10px]"
                              style={{ color: REASON_META[reason].color }}
                            >
                              {REASON_META[reason].glyph}
                            </span>
                          ))}
                        </button>
                      )}
                    </td>

                    <td
                      className="px-3 align-middle"
                      style={{
                        ...cell,
                        position: "sticky",
                        left: 30,
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
                      <Num className="text-[13.5px] sm:text-[14.5px]" style={{ color: "var(--text-hi)" }}>
                        {signed(team.benchWinsAboveAvg)}
                      </Num>
                    </td>

                    <td className="align-middle" style={cell}>
                      <div className="relative mx-auto" style={{ width: 176, height: 44 }}>
                        <div
                          aria-hidden="true"
                          style={{ position: "absolute", left: BAR_HALF, top: 0, bottom: 0, width: 1, background: "var(--rule-3)" }}
                        />
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
                            transition: reduced ? "none" : `transform 560ms var(--ease-grow) ${index * 14}ms`,
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
                            transition: reduced ? "none" : `transform 560ms var(--ease-grow) ${index * 14}ms`,
                          }}
                        />
                      </div>
                    </td>

                    <td className="px-3 text-right align-middle" style={cell}>
                      <Num className="text-[13.5px] sm:text-[14.5px]" style={{ color: "var(--text-hi)" }}>
                        {signed(team.starterBPM)}
                      </Num>
                    </td>
                    <td className="px-3 text-right align-middle" style={cell}>
                      <Num className="text-[13.5px] sm:text-[14.5px]" style={{ color: "var(--text-hi)" }}>
                        {signed(team.benchBPM)}
                      </Num>
                    </td>
                    <td className="px-3 text-right align-middle" style={cell}>
                      <Num className="text-[13.5px] sm:text-[14.5px]" style={{ color: "var(--text-hi)" }}>
                        {fixed(team.projWins, 1)}
                      </Num>
                    </td>
                    <td className="px-3 text-right align-middle" style={cell}>
                      <Money className="text-[13.5px] sm:text-[14.5px]" text={formatMillions(team.benchPayroll)} />
                    </td>
                    <td className="px-3 text-right align-middle" style={cell}>
                      <Num
                        className="text-[13.5px] sm:text-[14.5px]"
                        style={{ color: surplusNeg ? "var(--neg)" : "var(--pos)" }}
                      >
                        {formatSurplus(team.benchSurplusValue)}
                      </Num>
                    </td>
                  </tr>

                  {reasons.length > 0 && isExpanded && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-3"
                        style={{ background: "var(--bg-overlay)", borderBottom: "1px solid var(--rule-2)" }}
                      >
                        <FlagDetails flags={team.dataFlags} />
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
