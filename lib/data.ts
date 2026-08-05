import raw from "@/data/deep-bench-data-v2.json";
import type { DeepBenchData, Lineup, MinutesRow, Team } from "@/lib/types";

/**
 * The JSON is the single source of truth. No value shown on the page — BPM,
 * wins, gain, surplus, salary, or minutes — is derived, averaged, or recomputed
 * here or in any component. Every displayed number is a direct field read.
 *
 * The build-time guard (scripts/check-data.mjs, run via prebuild) is what makes
 * that safe across a data swap: it fails the build if the file breaks a league
 * identity or drops a field, so components can read fields without re-deriving
 * them defensively.
 */
export const deepBenchData = raw as unknown as DeepBenchData;

export const teams: Team[] = deepBenchData.teams;
export const lineups: Record<string, Lineup> = deepBenchData.lineups;
export const minutes: Record<string, MinutesRow[]> = deepBenchData.minutes;

/** Team codes in a stable alphabetical order, for the selector. */
export const teamCodes: string[] = teams.map((t) => t.team).sort();
