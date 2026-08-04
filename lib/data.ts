import raw from "@/data/deep-bench-data.json";
import type { DeepBenchData, Lineup, MinutesRow, Team } from "@/lib/types";

/**
 * The JSON is the single source of truth. Nothing here derives, cleans, or
 * recomputes a BPM, salary, win, gain, or minute value — values are read and
 * passed through untouched. The only derived *measurement* anywhere in the app
 * is the scatter's league-average payroll reference line, which the design
 * brief calls for and which is labelled as an average in the UI. Counts of
 * rendered rows (for example the tally of players at the model ceiling in the
 * minutes plan) are computed in their components; those describe the table on
 * screen rather than restating a metric.
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
