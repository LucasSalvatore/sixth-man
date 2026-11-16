import { formatMillions, formatSurplus, formatPercent, signed } from "@/lib/format";
import { teamIdentity } from "@/lib/teamColors";
import type { DeepBenchMeta, Team } from "@/lib/types";
import { Snapshot } from "@/components/Snapshot";
import { MicroLabel, Num } from "@/components/ui";

export type HeroStat = {
  /** Raw value read from the JSON on the server. */
  value: number;
  /** How to format the source value. */
  format: "wins" | "surplus";
  label: string;
  sub: string;
};

function render(stat: HeroStat, current: number): string {
  return stat.format === "surplus" ? formatSurplus(current) : signed(current, 1);
}

function Stat({ stat }: { stat: HeroStat }) {
  const finalText = render(stat, stat.value);
  const color =
    stat.format === "surplus"
      ? stat.value < 0
        ? "var(--neg)"
        : "var(--pos)"
      : "var(--text-hi)";
  return (
    <div className="flex flex-col gap-2">
      <div
        className="text-[34px] leading-none sm:text-[34px]"
        style={{ fontFamily: "var(--font-num)", letterSpacing: "-0.02em", color }}
      >
        <Num>{finalText}</Num>
      </div>
      <div className="max-w-[22ch]">
        <MicroLabel>{stat.label}</MicroLabel>
      </div>
      <div className="text-[12px]" style={{ color: "var(--text-lo)" }}>
        {stat.sub}
      </div>
    </div>
  );
}

export function Hero({
  stats,
  meta,
  best,
  priciest,
}: {
  stats: HeroStat[];
  meta: DeepBenchMeta;
  /** The two teams the lede names — passed in so every figure is a field read. */
  best?: Team;
  priciest?: Team;
}) {
  return (
    <header className="pt-14 sm:pt-20">
      <Num
        className="text-[12px]"
        style={{ letterSpacing: "0.14em", color: "var(--text-lo)", textTransform: "none" }}
      >
        deep-bench · {meta.seasonLabel}
      </Num>

      <h1
        className="mt-6 max-w-[19ch] text-display leading-[1.02] sm:text-display"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "var(--text-hi)",
        }}
      >
        NBA teams are bad at buying bench value.
      </h1>

      <p className="mt-7 max-w-[64ch] text-[15px] leading-[1.6] sm:text-[20px]">
        Bench payroll explains about <Num>{formatPercent(meta.r2)}</Num> of the variance in bench quality.
        {best && priciest && (
          <>
            {" "}
            {teamIdentity(best.team).name} built one of the league&apos;s best benches,{" "}
            <Num style={{ color: "var(--text-hi)" }}>{signed(best.benchWinsAboveAvg, 1)}</Num> wins above
            average, for <Num style={{ color: "var(--text-hi)" }}>{formatMillions(best.benchPayroll)}</Num>.{" "}
            {teamIdentity(priciest.team).name} committed{" "}
            <Num style={{ color: "var(--text-hi)" }}>{formatMillions(priciest.benchPayroll)}</Num> for{" "}
            <Num style={{ color: "var(--text-hi)" }}>{signed(priciest.benchWinsAboveAvg, 1)}</Num>.
          </>
        )}
      </p>

      <Snapshot meta={meta} />

      <div className="mt-10 grid grid-cols-1 gap-8 border-t pt-8 sm:grid-cols-3" style={{ borderColor: "var(--rule-1)" }}>
        {stats.map((stat) => (
          <Stat key={stat.label} stat={stat} />
        ))}
      </div>
    </header>
  );
}
