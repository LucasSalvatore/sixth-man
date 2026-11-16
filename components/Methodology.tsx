import type { DeepBenchMeta } from "@/lib/types";
import { FlagLegend } from "@/components/flags";
import { SourceText } from "@/components/SourceText";
import { Snapshot } from "@/components/Snapshot";
import { Num } from "@/components/ui";
import { formatPercent, sourcePrecision } from "@/lib/format";

const NOTES = [
  ["note-imputed", "Estimated players remain visible"],
  ["note-payroll", "Bench payroll is committed money only"],
  ["note-bpm", "Box scores have limits"],
  ["note-surplus", "Surplus follows the league’s own pricing"],
  ["note-constraints", "The optimal lineup is position-constrained"],
  ["note-linear", "The minutes optima are deliberately extreme"],
  ["note-roster", "Rosters reflect the source snapshot"],
];

export function Methodology({ meta }: { meta: DeepBenchMeta }) {
  return (
    <div>
      <div className="mb-10 p-5" style={{ background: "var(--bg-raised)", border: "1px solid var(--rule-1)" }}>
        <p className="mb-3 text-[12px]" style={{ color: "var(--text-lo)" }}>Quoted from the source file:</p>
        <div className="flex flex-col gap-3 text-[15px] leading-relaxed">
          <p><SourceText text={meta.winsFormula} /></p>
          <p><SourceText text={meta.benchSurplusFormula} /></p>
          <p><SourceText text={meta.starterBenchShareNote} /></p>
          <p>Source: <SourceText text={meta.season_source} /></p>
          <p>Source-reported correlation: r = <Num>{sourcePrecision(meta.r)}</Num>; explained variance: <Num>{formatPercent(meta.r2)}</Num>. These coefficients retain the source’s recorded precision.</p>
        </div>
        <Snapshot meta={meta} />
      </div>
      <div className="mb-10"><FlagLegend /></div>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-x-16">
        {NOTES.map(([id, title], i) => (
          <section key={id} id={id}>
            <h2 className="text-[20px]" style={{ fontFamily: "var(--font-display)", color: "var(--text-hi)" }}>{title}</h2>
            <p className="mt-2 max-w-[58ch] text-[15px] leading-relaxed"><SourceText text={meta.disclosures[i]} /></p>
          </section>
        ))}
      </div>
    </div>
  );
}
