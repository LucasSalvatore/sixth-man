/**
 * League structure: which conference and division each team plays in. This is
 * a fixed fact about the NBA, not a statistic, so it lives in code rather than
 * in a data file — but the data guard still checks that the thirty codes here
 * are exactly the thirty codes in the data.
 */

export type Conference = "East" | "West";

export type Division =
  | "Atlantic"
  | "Central"
  | "Southeast"
  | "Northwest"
  | "Pacific"
  | "Southwest";

export const DIVISIONS: Record<Division, { conference: Conference; teams: string[] }> = {
  Atlantic: { conference: "East", teams: ["BOS", "BKN", "NYK", "PHI", "TOR"] },
  Central: { conference: "East", teams: ["CHI", "CLE", "DET", "IND", "MIL"] },
  Southeast: { conference: "East", teams: ["ATL", "CHA", "MIA", "ORL", "WAS"] },
  Northwest: { conference: "West", teams: ["DEN", "MIN", "OKC", "POR", "UTA"] },
  Pacific: { conference: "West", teams: ["GSW", "LAC", "LAL", "PHX", "SAC"] },
  Southwest: { conference: "West", teams: ["DAL", "HOU", "MEM", "NOP", "SAS"] },
};

export const CONFERENCES: Conference[] = ["East", "West"];

const byTeam = new Map<string, { conference: Conference; division: Division }>();
for (const [division, { conference, teams }] of Object.entries(DIVISIONS) as [
  Division,
  { conference: Conference; teams: string[] },
][]) {
  for (const team of teams) byTeam.set(team, { conference, division });
}

export function conferenceOf(code: string): Conference | null {
  return byTeam.get(code)?.conference ?? null;
}

export function divisionOf(code: string): Division | null {
  return byTeam.get(code)?.division ?? null;
}

/** All thirty codes, alphabetical. */
export const LEAGUE_CODES: string[] = [...byTeam.keys()].sort();
