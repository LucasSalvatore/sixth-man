export type Team = {
  team: string;
  starterBPM: number;
  benchBPM: number;
  projWins: number;
  benchWinsAboveAvg: number;
  benchPayroll: number;
  costPerBenchWin: number | null;
  dataFlag: string | null;
};

export type LineupPlayer = {
  name: string;
  pos: string;
  bpm: number;
  /**
   * Null for unsigned free agents (DET/Jalen Duren, GSW/Gary Payton II). The
   * source carries no 2026-27 salary for them, so the UI says "Unsigned"
   * rather than printing a zero.
   */
  salary: number | null;
};

/**
 * Only 24 of the 30 teams have a lineup entry, and 7 of those carry four
 * players rather than five. Both are properties of the source data (players
 * without a 2025-26 BPM are excluded upstream) and are surfaced as-is.
 */
export type Lineup = {
  current: LineupPlayer[];
  optimal: LineupPlayer[];
  curBPM: number;
  optBPM: number;
  gainWins: number;
};

export type MinutesRow = {
  name: string;
  role: "Starter" | "Bench";
  cur: number;
  opt: number;
  delta: number;
  bpm: number;
  gp: number;
};

export type DeepBenchMeta = {
  title: string;
  season_source: string;
  winsFormula: string;
  benchWinsMetric: string;
  disclosures: string[];
};

export type DeepBenchData = {
  meta: DeepBenchMeta;
  teams: Team[];
  lineups: Record<string, Lineup>;
  minutes: Record<string, MinutesRow[]>;
};
