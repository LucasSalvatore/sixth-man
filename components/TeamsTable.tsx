"use client";

import { Fragment, useMemo, useState } from "react";
import type { Team } from "@/lib/types";
import { formatMillions } from "@/lib/format";

type SortKey =
  | "team"
  | "projWins"
  | "starterBPM"
  | "benchBPM"
  | "benchWinsAboveAvg"
  | "benchPayroll"
  | "costPerBenchWin";

type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "team", label: "Team" },
  { key: "projWins", label: "Proj. Wins" },
  { key: "starterBPM", label: "Starter BPM" },
  { key: "benchBPM", label: "Bench BPM" },
  { key: "benchWinsAboveAvg", label: "Bench Wins Above Avg" },
  { key: "benchPayroll", label: "Bench Payroll" },
  { key: "costPerBenchWin", label: "Cost / Bench Win" },
];

const FORMATTERS: Record<SortKey, (team: Team) => string> = {
  team: (t) => t.team,
  projWins: (t) => t.projWins.toFixed(1),
  starterBPM: (t) => t.starterBPM.toFixed(2),
  benchBPM: (t) => t.benchBPM.toFixed(2),
  benchWinsAboveAvg: (t) => t.benchWinsAboveAvg.toFixed(2),
  benchPayroll: (t) => formatMillions(t.benchPayroll),
  costPerBenchWin: (t) => formatMillions(t.costPerBenchWin),
};

export function TeamsTable({ teams }: { teams: Team[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("projWins");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const rows = [...teams];
    rows.sort((a, b) => {
      if (sortKey === "team") {
        const cmp = a.team.localeCompare(b.team);
        return sortDir === "asc" ? cmp : -cmp;
      }

      const av = a[sortKey];
      const bv = b[sortKey];

      // Nulls (undefined costPerBenchWin) always sort last, in either direction.
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;

      const cmp = av - bv;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [teams, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "team" ? "asc" : "desc");
    }
  }

  return (
    <div className="overflow-x-auto border border-neutral-300 dark:border-neutral-700">
      <table className="w-full min-w-[720px] border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                aria-sort={
                  sortKey === col.key
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className={`whitespace-nowrap px-2 py-2 font-semibold sm:px-3 ${
                  col.key === "team" ? "text-left" : "text-right"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSort(col.key)}
                  className="inline-flex items-center gap-1 hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500"
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span aria-hidden="true">{sortDir === "asc" ? "▲" : "▼"}</span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((team) => {
            const hasFlag = Boolean(team.dataFlag);
            const isExpanded = expanded === team.team;
            return (
              <Fragment key={team.team}>
                <tr className="border-b border-neutral-200 last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">
                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className={`whitespace-nowrap px-2 py-2 sm:px-3 ${
                        col.key === "team" ? "text-left" : "text-right"
                      }`}
                    >
                      {col.key === "team" ? (
                        <span className="inline-flex items-center gap-1.5">
                          {hasFlag && (
                            <button
                              type="button"
                              title={team.dataFlag ?? undefined}
                              aria-expanded={isExpanded}
                              aria-label={`Data limitation for ${team.team}: ${team.dataFlag}`}
                              onClick={() =>
                                setExpanded((cur) => (cur === team.team ? null : team.team))
                              }
                              className="text-amber-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-600 dark:text-amber-500"
                            >
                              {"⚠"}
                            </button>
                          )}
                          <span>{team.team}</span>
                        </span>
                      ) : (
                        FORMATTERS[col.key](team)
                      )}
                    </td>
                  ))}
                </tr>
                {hasFlag && isExpanded && (
                  <tr className="border-b border-neutral-200 bg-amber-50 dark:border-neutral-800 dark:bg-amber-950">
                    <td
                      colSpan={COLUMNS.length}
                      className="whitespace-normal px-2 py-2 text-left text-xs text-amber-900 sm:px-3 dark:text-amber-200"
                    >
                      {team.dataFlag}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
