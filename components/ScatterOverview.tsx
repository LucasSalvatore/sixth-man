import type { Team } from "@/lib/types";
import { fairPricePath, scatterGeometry } from "@/lib/scatter";
import { isAchromatic, teamIdentity } from "@/lib/teamColors";

/** Server-rendered overview with no scaled text or interactive hit targets. */
export function ScatterOverview({ teams, leagueAvgBenchPayroll }: { teams: Team[]; leagueAvgBenchPayroll: number }) {
  const g = scatterGeometry(640, 300);
  return (
    <svg viewBox="0 0 640 300" className="block h-full w-full" role="img" aria-label="Bench payroll against bench wins above average. Full source values are listed in the team comparison below.">
      <line x1={g.left} x2={g.right} y1={g.y(0)} y2={g.y(0)} stroke="var(--rule-4)" strokeDasharray="6 5" />
      <line x1={g.x(leagueAvgBenchPayroll)} x2={g.x(leagueAvgBenchPayroll)} y1={g.top} y2={g.bottom} stroke="var(--gold)" strokeWidth={2} strokeDasharray="4 6" />
      <polyline data-fair-price points={fairPricePath(teams, g)} fill="none" stroke="var(--text-mid)" strokeWidth={2} />
      {teams.map((team) => <circle key={team.team} data-preview-team={team.team} cx={g.x(team.benchPayroll)} cy={g.y(team.benchWinsAboveAvg)} r={5} fill={isAchromatic(team.team) ? "var(--bg-base)" : teamIdentity(team.team).color} stroke={teamIdentity(team.team).color} strokeWidth={2} />)}
    </svg>
  );
}
