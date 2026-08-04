import { BenchScatter } from "@/components/BenchScatter";
import { Hero } from "@/components/Hero";
import { Methodology } from "@/components/Methodology";
import { TeamExplorer } from "@/components/TeamExplorer";
import { TeamsTable } from "@/components/TeamsTable";
import { Reveal, SectionHead } from "@/components/ui";
import {
  deepBenchData,
  leagueAveragePayroll,
  lineups,
  minutes,
  teamCodes,
  teams,
} from "@/lib/data";

export default function Home() {
  const { meta } = deepBenchData;

  // Read on the server, straight from the JSON — no literals duplicated in the UI.
  const bos = teams.find((t) => t.team === "BOS");
  const counterValues = [
    bos?.benchWinsAboveAvg ?? 0,
    bos?.costPerBenchWin ?? 0,
    lineups.PHX?.gainWins ?? 0,
    minutes.CLE?.find((p) => p.name === "Thomas Bryant")?.delta ?? 0,
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-0 sm:px-8">
      <Hero counterValues={counterValues} />

      <main>
        <section className="mt-16 sm:mt-24">
          <SectionHead
            id="scatter"
            title="Bench spending against bench value"
            deck="Thirty benches plotted by what they cost and what they add."
          />
          <Reveal>
            <BenchScatter teams={teams} leagueAveragePayroll={leagueAveragePayroll} />
          </Reveal>
        </section>

        <section className="mt-24 sm:mt-28">
          <SectionHead
            id="table"
            title="All thirty benches"
            deck="Sortable. Click a column head to reorder; hover a row to bring up that team's colour."
          />
          <TeamsTable teams={teams} />
        </section>

        <TeamExplorer
          teamCodes={teamCodes}
          teams={teams}
          lineups={lineups}
          minutes={minutes}
        />

        <section className="mt-24 sm:mt-28" id="methodology">
          <SectionHead
            id="methodology-head"
            title="How this was built"
            deck="What the model can see, and the five places it cannot."
          />
          <Methodology meta={meta} />
        </section>
      </main>

      <footer
        className="mt-24 py-12 sm:mt-28"
        style={{ borderTop: "1px solid var(--rule-2)" }}
      >
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
