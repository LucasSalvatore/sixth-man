// Team identity colours, used ONLY as the reactive accent (no logos, no photos).
// Each is the team's official iconic colour; where that colour fell below a
// 4.5:1 contrast floor on the near-black surface, its HSL lightness was raised
// until it cleared the floor. Hue and saturation are untouched, so identity holds.

export type TeamIdentity = { name: string; color: string };

export const TEAM_IDENTITY: Record<string, TeamIdentity> = {
  ATL: { name: "Atlanta Hawks", color: "#E03A3E" }, // 4.54:1
  BKN: { name: "Brooklyn Nets", color: "#FFFFFF" }, // 19.67:1
  BOS: { name: "Boston Celtics", color: "#008C3A" }, // 4.51:1
  CHA: { name: "Charlotte Hornets", color: "#00859B" }, // 4.52:1
  CHI: { name: "Chicago Bulls", color: "#EC184E" }, // 4.50:1
  CLE: { name: "Cleveland Cavaliers", color: "#FDBB30" }, // 11.55:1
  DAL: { name: "Dallas Mavericks", color: "#007CD1" }, // 4.50:1
  DEN: { name: "Denver Nuggets", color: "#FEC524" }, // 12.39:1
  DET: { name: "Detroit Pistons", color: "#ED193C" }, // 4.50:1
  GSW: { name: "Golden State Warriors", color: "#FFC72C" }, // 12.61:1
  HOU: { name: "Houston Rockets", color: "#EC184E" }, // 4.50:1
  IND: { name: "Indiana Pacers", color: "#FDBB30" }, // 11.55:1
  LAC: { name: "LA Clippers", color: "#ED193C" }, // 4.50:1
  LAL: { name: "Los Angeles Lakers", color: "#FDB927" }, // 11.38:1
  MEM: { name: "Memphis Grizzlies", color: "#6079AB" }, // 4.52:1
  MIA: { name: "Miami Heat", color: "#F9A01B" }, // 9.44:1
  MIL: { name: "Milwaukee Bucks", color: "#EEE1C6" }, // 15.20:1
  MIN: { name: "Minnesota Timberwolves", color: "#78BE20" }, // 8.60:1
  NOP: { name: "New Orleans Pelicans", color: "#ED193C" }, // 4.50:1
  NYK: { name: "New York Knicks", color: "#F58426" }, // 7.69:1
  OKC: { name: "Oklahoma City Thunder", color: "#007EC7" }, // 4.51:1
  ORL: { name: "Orlando Magic", color: "#007ECB" }, // 4.54:1
  PHI: { name: "Philadelphia 76ers", color: "#007CD3" }, // 4.52:1
  PHX: { name: "Phoenix Suns", color: "#E56020" }, // 5.65:1
  POR: { name: "Portland Trail Blazers", color: "#E03A3E" }, // 4.54:1
  SAC: { name: "Sacramento Kings", color: "#9760C7" }, // 4.51:1
  SAS: { name: "San Antonio Spurs", color: "#C4CED4" }, // 12.30:1
  TOR: { name: "Toronto Raptors", color: "#EC184E" }, // 4.50:1
  UTA: { name: "Utah Jazz", color: "#F9A01B" }, // 9.44:1
  WAS: { name: "Washington Wizards", color: "#E82744" }, // 4.50:1
};

export const FALLBACK_IDENTITY: TeamIdentity = { name: "", color: "#D9C08C" };

export function teamIdentity(code: string): TeamIdentity {
  return TEAM_IDENTITY[code] ?? { ...FALLBACK_IDENTITY, name: code };
}

/**
 * Three identities sit in the same tonal/chromatic region as the body text
 * (OKLCH chroma < 0.045), so tinting with them would be invisible — nothing
 * would appear to change on hover. Their colour is never substituted; only the
 * *form* of the takeover changes (hollow scatter point, doubled keyline,
 * inner rule on a bar). Derived chroma: BKN #FFFFFF 0.000, SAS #C4CED4 0.014,
 * MIL #EEE1C6 0.038. Nothing else in the league falls below MEM at 0.083.
 */
export const ACHROMATIC: ReadonlySet<string> = new Set(["BKN", "SAS", "MIL"]);

export function isAchromatic(code: string): boolean {
  return ACHROMATIC.has(code);
}
