"use client";

import { Fragment, useCallback, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
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

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "benchSurplusValue", label: "Surplus value" },
  { key: "benchWinsAboveAvg", label: "Bench wins vs average" },
  { key: "benchPayroll", label: "Bench payroll" },
  { key: "starterBPM", label: "Starter BPM" },
  { key: "benchBPM", label: "Bench BPM" },
  { key: "projWins", label: "Projected wins" },
  { key: "team", label: "Team code" },
];

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
  const sortId = useId();
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
        style={{ background: "var(--bg-panel)", position: "sticky", top: 56, zIndex: 3, borderBottom: "1px solid var(--rule-2)" }}
      >
        <button
          type="button"
          onClick={() => handleSort(key)}
          className="inline-flex min-h-8 items-center gap-1 text-[12px]"
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
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 sm:flex-none">
          <label htmlFor={sortId} className="mb-2 block text-[12px]" style={{ color: "var(--text-lo)" }}>
            Sort teams by
          </label>
          <select
            id={sortId}
            value={sortKey}
            onChange={(event) => handleSort(event.target.value as SortKey)}
            className="min-h-10 w-full rounded-none border px-3 py-2 text-[15px] sm:w-auto"
            style={{ background: "var(--bg-panel)", borderColor: "var(--rule-2)", color: "var(--text-hi)" }}
          >
            {SORT_OPTIONS.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
        <button
          type="button"
          aria-label={`${sortDir === "asc" ? "Ascending ↑" : "Descending ↓"} — Reverse team sort order`}
          onClick={() => setSortDir((direction) => direction === "asc" ? "desc" : "asc")}
          className="min-h-10 border px-3 py-2 text-[12px]"
          style={{ borderColor: "var(--rule-2)", color: "var(--text-hi)" }}
        >
          {sortDir === "asc" ? "Ascending ↑" : "Descending ↓"}
        </button>
      </div>

      {/* Both views use the same sorted data and controls. The table stays out
          of the accessibility tree until all columns fit without a scroller. */}
      <ol className="grid gap-3 sm:grid-cols-2 xl:hidden" aria-label="Ranked teams" data-testid="team-cards">
        {sorted.map((team) => {
          const identity = teamIdentity(team.team);
          const reasons = reasonsOf(team);
          const isExpanded = expanded === team.team;
          return (
            <li
              key={team.team}
              data-team-card={team.team}
              className="min-w-0 border p-4"
              style={{ background: "var(--bg-panel)", borderColor: "var(--rule-2)", borderTop: `2px solid ${identity.color}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <Link prefetch={false} href={`/teams/${team.team}`} className="min-w-0 underline-offset-4 hover:underline">
                  <Num className="block text-[20px]" style={{ color: "var(--text-hi)" }}>{team.team}</Num>
                  <span className="mt-1 block text-[12px]" style={{ color: "var(--text-lo)" }}>{identity.name}</span>
                </Link>
                <dl className="shrink-0 text-right">
                  <dt className="text-[12px]" style={{ color: "var(--text-lo)" }}>Surplus value</dt>
                  <dd data-field="surplus" className="mt-1">
                    <Num className="text-[20px]" style={{ color: team.benchSurplusValue < 0 ? "var(--neg)" : "var(--pos)" }}>
                      {formatSurplus(team.benchSurplusValue)}
                    </Num>
                  </dd>
                </dl>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: "var(--rule-1)" }}>
                <div>
                  <dt className="text-[12px]" style={{ color: "var(--text-lo)" }}>Bench WAA</dt>
                  <dd data-field="bench-wins" className="mt-1"><Num className="text-[15px]" style={{ color: "var(--text-hi)" }}>{signed(team.benchWinsAboveAvg)}</Num></dd>
                </div>
                <div className="text-right">
                  <dt className="text-[12px]" style={{ color: "var(--text-lo)" }}>Bench payroll</dt>
                  <dd data-field="payroll" className="mt-1"><Money className="text-[15px]" text={formatMillions(team.benchPayroll)} /></dd>
                </div>
              </dl>
              {reasons.length > 0 && (
                <div className="mt-3 border-t pt-2" style={{ borderColor: "var(--rule-1)" }}>
                  <button
                    type="button"
                    data-flag-toggle=""
                    aria-expanded={isExpanded}
                    aria-controls={`${sortId}-card-flags-${team.team}`}
                    aria-label={`${isExpanded ? "Hide" : "Show"} data flags for ${team.team}`}
                    onClick={() => setExpanded((current) => current === team.team ? null : team.team)}
                    className="inline-flex min-h-8 min-w-8 items-center gap-2 text-[12px]"
                    style={{ color: "var(--text-hi)" }}
                  >
                    {reasons.map((reason) => <span key={reason} aria-hidden="true" style={{ color: REASON_META[reason].color }}>{REASON_META[reason].glyph}</span>)}
                    {isExpanded ? "Hide data flags" : "Show data flags"}
                  </button>
                  <div id={`${sortId}-card-flags-${team.team}`} hidden={!isExpanded} className="pt-2">
                    <FlagDetails flags={team.dataFlags} />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* No overflow ancestor: sticky headers follow the page beneath its nav. */}
      <div className="hidden xl:block" style={{ border: "1px solid var(--rule-2)" }}>
        <table
          className="w-full"
          style={{
            borderCollapse: "separate",
            borderSpacing: 0,
            tableLayout: "fixed",
            background: "var(--bg-panel)",
          }}
        >
          <colgroup>
            <col style={{ width: 40 }} />
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
            <tr>
              <th
                scope="col"
                style={{
                  background: "var(--bg-panel)",
                  position: "sticky",
                  top: 56,
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
                  top: 56,
                  zIndex: 4,
                  borderBottom: "1px solid var(--rule-2)",
                  borderRight: "1px solid var(--rule-2)",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSort("team")}
                  className="inline-flex min-h-8 items-center gap-1 text-[12px]"
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
                          aria-label={`${isExpanded ? "Hide" : "Show"} data flags for ${team.team}`}
                          onClick={() => setExpanded((cur) => (cur === team.team ? null : team.team))}
                          data-flag-toggle=""
                          className="inline-flex min-h-8 min-w-8 items-center justify-center gap-0.5 leading-none"
                        >
                          {reasons.map((reason) => (
                            <span
                              key={reason}
                              aria-hidden="true"
                              className="text-[12px]"
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
                        left: 40,
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
                        <Link prefetch={false} href={`/teams/${team.team}`} className="underline-offset-4 hover:underline">
                          <Num
                            className={`text-[15px] ${live ? "team-text" : ""}`}
                            style={{ fontWeight: 500, color: live ? undefined : "var(--text-hi)" }}
                          >
                            {team.team}
                          </Num>
                        </Link>
                      </span>
                    </td>

                    <td className="px-3 text-right align-middle" style={cell}>
                      <Num className="text-[15px]" style={{ color: "var(--text-hi)" }}>
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
                      <Num className="text-[15px]" style={{ color: "var(--text-hi)" }}>
                        {signed(team.starterBPM)}
                      </Num>
                    </td>
                    <td className="px-3 text-right align-middle" style={cell}>
                      <Num className="text-[15px]" style={{ color: "var(--text-hi)" }}>
                        {signed(team.benchBPM)}
                      </Num>
                    </td>
                    <td className="px-3 text-right align-middle" style={cell}>
                      <Num className="text-[15px]" style={{ color: "var(--text-hi)" }}>
                        {fixed(team.projWins, 1)}
                      </Num>
                    </td>
                    <td className="px-3 text-right align-middle" style={cell}>
                      <Money className="text-[15px]" text={formatMillions(team.benchPayroll)} />
                    </td>
                    <td className="px-3 text-right align-middle" style={cell}>
                      <Num
                        className="text-[15px]"
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
