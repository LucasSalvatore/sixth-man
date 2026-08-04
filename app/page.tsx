import { BenchScatter } from "@/components/BenchScatter";
import { Hero, type HeroStat } from "@/components/Hero";
import { Methodology } from "@/components/Methodology";
import { TeamExplorer } from "@/components/TeamExplorer";
import { TeamsTable } from "@/components/TeamsTable";
import { Reveal, SectionHead } from "@/components/ui";
import { deepBenchData, lineups, minutes, teamCodes, teams } from "@/lib/data";

export default function Home() {
  const { meta } = deepBenchData;

  // Read on the server, straight from the JSON — no literals duplicated in the UI.
  const bos = teams.find((t) => t.team === "BOS");
  const den = teams.find((t) => t.team === "DEN");
  const por = teams.find((t) => t.team === "POR");
  const heroStats: HeroStat[] = [
    { value: bos?.benchWinsAboveAvg ?? 0, format: "wins", label: "Best bench, wins above average", sub: "Boston" },
    { value: den?.benchSurplusValue ?? 0, format: "surplus", label: "Biggest bargain by surplus value", sub: "Denver" },
    { value: por?.benchSurplusValue ?? 0, format: "surplus", label: "Biggest overpay by surplus value", sub: "Portland" },
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
      {/* Act 1 — the argument: the headline claim and the chart that carries it. */}
      <Hero stats={heroStats} />

      <div className="mt-16 sm:mt-20">
        <Reveal>
          <BenchScatter teams={teams} />
        </Reveal>
      </div>

      {/* Act 2 — the evidence: every team, sortable. */}
      <section className="mt-24 sm:mt-32">
        <SectionHead
          id="table"
          title="All thirty benches"
          deck="The same thirty teams, ranked by surplus value. Click a column head to reorder; hover a row for that team's colour."
        />
        <TeamsTable teams={teams} />
      </section>

      {/* A real break before Act 3 — the tool changes register from reading to doing. */}
      <div className="mt-28 border-t pt-6 sm:mt-36" style={{ borderColor: "var(--rule-2)" }}>
        <div className="text-[11.5px]" style={{ fontFamily: "var(--font-num)", letterSpacing: "0.14em", color: "var(--text-lo)" }}>
          The tool
        </div>
        <h2
          className="mt-3 max-w-[20ch] text-[26px] leading-[1.12] sm:text-[34px]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.01em", color: "var(--text-hi)" }}
        >
          Pick a team, and see where the model would move it.
        </h2>
        <p className="mt-3 max-w-[62ch] text-[15px] leading-[1.6]" style={{ color: "var(--text-mid)" }}>
          One selection drives both panels below.
        </p>
      </div>

      <div className="mt-12">
        <TeamExplorer teamCodes={teamCodes} lineups={lineups} minutes={minutes} />
      </div>

      <section className="mt-28 sm:mt-36" id="methodology">
        <SectionHead
          id="methodology-head"
          title="How this was built"
          deck="What the model can see, and the seven places it cannot."
        />
        <Methodology meta={meta} />
      </section>

      <footer className="mt-24 py-12 sm:mt-32" style={{ borderTop: "1px solid var(--rule-2)" }}>
        <span
          className="text-[16px]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--gold)" }}
        >
          Lucan Labs
        </span>
      </footer>
    </div>
  );
}
