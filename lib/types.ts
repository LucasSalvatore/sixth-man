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
 * The source carries no lineup entry for CHA, BKN, IND, DAL, UTA or SAC, and
 * lists four players for CHI, GSW, HOU, MEM, MIN, POR and WAS. The source gives
 * no reason for either; both are surfaced as-is. Do not infer a cause — all six
 * teams without a lineup have eight fully graded players in `minutes`.
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
