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
};
