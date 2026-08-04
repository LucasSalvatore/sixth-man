/** The two imputation reasons carried by flagged players. They mean different
 *  things and must read differently in the UI:
 *  - returning_from_injury: a real prior-season BPM reused as a prior.
 *  - rookie_no_history: a modeled placeholder, not a real stat. */
export type ImputeReason = "returning_from_injury" | "rookie_no_history";

export type DataFlag = {
  player: string;
  reason: ImputeReason;
  note: string;
};

export type Team = {
  team: string;
  starterBPM: number;
  benchBPM: number;
  nBench: number;
  projWins: number;
  benchWinsAboveAvg: number;
  benchPayroll: number;
  fairMarketBenchPayroll: number;
  /** Signed dollars: positive = bargain, negative = overpaying, vs the league's
   *  own revealed pricing. Always defined — there is no undefined state. */
  benchSurplusValue: number;
  dataFlags: DataFlag[];
};

export type LineupPlayer = {
  name: string;
  /** Null when the source has no position history (imputed players). */
  pos: string | null;
  bpm: number;
  /** Null for unsigned free agents (no confirmed 2026-27 salary). */
  salary: number | null;
  /** Non-null when this player's BPM is imputed rather than measured. */
  imputed: ImputeReason | null;
};

export type Lineup = {
  current: LineupPlayer[];
  optimal: LineupPlayer[];
  /** Guaranteed equal to the team's starterBPM by construction. */
  curLineupBPM: number;
  optLineupBPM: number;
  gainWins: number;
};

export type MinutesRow = {
  name: string;
  role: "Starter" | "Bench";
  cur: number;
  opt: number;
  delta: number;
  bpm: number;
  imputed: ImputeReason | null;
};

export type DeepBenchMeta = {
  title: string;
  version: number;
  season_source: string;
  winsFormula: string;
  leagueAdjustment: number;
  leagueAdjustmentNote: string;
  starterBenchShareNote: string;
  benchSurplusFormula: string;
  lineupModelNote: string;
  disclosures: string[];
};

export type DeepBenchData = {
  meta: DeepBenchMeta;
  teams: Team[];
  lineups: Record<string, Lineup>;
  minutes: Record<string, MinutesRow[]>;
};
