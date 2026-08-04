import raw from "@/data/deep-bench-data.json";
import type { DeepBenchData, Lineup, MinutesRow, Team } from "@/lib/types";

/**
 * The JSON is the single source of truth. Nothing here derives, cleans, or
 * recomputes a BPM, salary, win, gain, or minute value — values are read and
 * passed through untouched. The only computed figure anywhere in the app is
 * the scatter's league-average payroll reference line, which the design brief
 * explicitly calls for and which is labelled as such in the UI.
 */
export const deepBenchData = raw as unknown as DeepBenchData;

export const teams: Team[] = deepBenchData.teams;
export const lineups: Record<string, Lineup> = deepBenchData.lineups;
export const minutes: Record<string, MinutesRow[]> = deepBenchData.minutes;

/** Team codes in a stable alphabetical order, for the selector. */
export const teamCodes: string[] = teams.map((t) => t.team).sort();

/** Mean bench payroll, used only for the scatter's labelled reference line. */
export const leagueAveragePayroll: number =
  teams.reduce((sum, t) => sum + t.benchPayroll, 0) / teams.length;
