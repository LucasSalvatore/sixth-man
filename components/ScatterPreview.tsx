import Link from "next/link";
import type { Team } from "@/lib/types";
import { ScatterOverview } from "@/components/ScatterOverview";
import { formatMillions } from "@/lib/format";
import { Num } from "@/components/ui";

/** Static overview: only the surrounding link is interactive. */
export function ScatterPreview({ teams, leagueAvgBenchPayroll }: { teams: Team[]; leagueAvgBenchPayroll: number }) {
  return (
    <Link prefetch={false} href="/bench" data-scatter-preview className="block p-5 sm:p-8" style={{ background: "var(--bg-raised)", border: "1px solid var(--rule-2)" }}>
      <div className="grid items-center gap-6 sm:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="text-[34px] leading-tight" style={{ fontFamily: "var(--font-display)", color: "var(--text-hi)" }}>What payroll buys</h2>
          <p className="mt-3 max-w-[36ch] text-[15px] leading-relaxed">Every bench, from committed payroll to wins above average. The solid line is the model’s fair price.</p>
          <p className="mt-3 text-[12px]" style={{ color: "var(--text-lo)" }}>Dashed rule: league-average payroll <Num>{formatMillions(leagueAvgBenchPayroll)}</Num></p>
          <span className="mt-5 inline-block text-[15px] underline underline-offset-4">Explore the chart →</span>
        </div>
        <div>
          <p className="text-[12px]" style={{ color: "var(--text-lo)" }}>Bench wins above average ↑</p>
          <ScatterOverview teams={teams} leagueAvgBenchPayroll={leagueAvgBenchPayroll} />
          <p className="text-right text-[12px]" style={{ color: "var(--text-lo)" }}>Bench payroll →</p>
        </div>
      </div>
    </Link>
  );
}
