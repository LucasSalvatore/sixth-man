"use client";

import { useCountUp } from "@/lib/motion";
import { formatMillions, formatSurplus, signed } from "@/lib/format";
import { teamIdentity } from "@/lib/teamColors";
import type { Team } from "@/lib/types";
import { GhostSized, MicroLabel, Num } from "@/components/ui";

export type HeroStat = {
  /** Raw value read from the JSON on the server. */
  value: number;
  /** How to render it once counted up. */
  format: "wins" | "surplus";
  label: string;
  sub: string;
};

function render(stat: HeroStat, current: number): string {
  return stat.format === "surplus" ? formatSurplus(current) : signed(current, 1);
}

function Stat({ stat, index }: { stat: HeroStat; index: number }) {
  const current = useCountUp(stat.value, { duration: 1100, delay: 200 + index * 110 });
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
        className="text-[26px] leading-none sm:text-[32px]"
        style={{ fontFamily: "var(--font-num)", letterSpacing: "-0.02em", color }}
      >
        <GhostSized finalText={finalText}>{render(stat, current)}</GhostSized>
      </div>
      <div className="max-w-[22ch]">
        <MicroLabel>{stat.label}</MicroLabel>
      </div>
      <div className="text-[12.5px]" style={{ color: "var(--text-lo)" }}>
        {stat.sub}
      </div>
    </div>
  );
}

export function Hero({
  stats,
  best,
  priciest,
}: {
  stats: HeroStat[];
  /** The two teams the lede names — passed in so every figure is a field read. */
  best?: Team;
  priciest?: Team;
}) {
  return (
    <header className="pt-14 sm:pt-20">
      <Num
        className="text-[12.5px]"
        style={{ letterSpacing: "0.14em", color: "var(--text-lo)", textTransform: "none" }}
      >
        deep-bench · bench value, 2025-26
      </Num>

      <h1
        className="mt-6 max-w-[19ch] text-[40px] leading-[1.02] sm:text-[68px]"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "var(--text-hi)",
        }}
      >
        NBA teams are bad at buying bench value.
      </h1>

      <p className="mt-7 max-w-[64ch] text-[16px] leading-[1.6] sm:text-[18px]">
        Bench payroll explains about six percent of the variance in bench quality.
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

      <div className="mt-10 grid grid-cols-1 gap-8 border-t pt-8 sm:grid-cols-3" style={{ borderColor: "var(--rule-1)" }}>
        {stats.map((stat, index) => (
          <Stat key={stat.label} stat={stat} index={index} />
        ))}
      </div>
    </header>
  );
}
