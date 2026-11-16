import { BenchScatter } from "@/components/BenchScatter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Hero, type HeroStat } from "@/components/Hero";
import { teamIdentity } from "@/lib/teamColors";
import Link from "next/link";
import { SelectedTeamProvider } from "@/components/SelectedTeamProvider";
import { TeamExplorer } from "@/components/TeamExplorer";
import { TeamsTable } from "@/components/TeamsTable";
import { Reveal, SectionHead } from "@/components/ui";
import { deepBenchData, lineups, minutes, teamCodes, teams } from "@/lib/data";

export const metadata = { title: "Bench value — deep-bench", alternates: { canonical: "/bench" } };

export default function BenchPage() {

  // Read on the server, straight from the JSON — no literals duplicated in the UI.
  const best = [...teams].sort((a, b) => b.benchWinsAboveAvg - a.benchWinsAboveAvg)[0];
  const bargain = [...teams].sort((a, b) => b.benchSurplusValue - a.benchSurplusValue)[0];
  const overpay = [...teams].sort((a, b) => a.benchSurplusValue - b.benchSurplusValue)[0];
  const priciest = [...teams].sort((a, b) => b.benchPayroll - a.benchPayroll)[0];
  const heroStats: HeroStat[] = [
    { value: best.benchWinsAboveAvg, format: "wins", label: "Best bench, wins above average", sub: teamIdentity(best.team).name },
    { value: bargain.benchSurplusValue, format: "surplus", label: "Biggest bargain by surplus value", sub: teamIdentity(bargain.team).name },
    { value: overpay.benchSurplusValue, format: "surplus", label: "Biggest overpay by surplus value", sub: teamIdentity(overpay.team).name },
  ];

  return (
    // The outer measure is wide — sized for the scatter and the table, the two
    // sections that actually benefit from desktop width. Prose sections
    // (Hero, the tool intro, methodology, footer) each get their own narrower
    // inner wrapper below, so the contrast between "reading" and "using" stays
    // deliberate rather than accidental. At 375px, max-w-[1560px] is inert —
    // the flexible layout and the inner max-w-[1240px] wrappers both collapse
    // to the viewport width the same way they always did.
    <div className="mx-auto max-w-[1560px] px-4 sm:px-8">
      {/* Act 1 — the argument: the headline claim and the chart that carries it. */}
      <div className="mx-auto max-w-[1240px]">
        <Hero stats={heroStats} best={best} priciest={priciest} meta={deepBenchData.meta} />
      </div>

      {/*
        Scatter and the tool section share one team selection — clicking a
        point or a rail cell both drive the lineup optimizer and minutes plan.
        The table sits between them in the DOM but never reads this context,
        so it cannot re-render, let alone remount, when the selection changes.
      */}
      <SelectedTeamProvider defaultTeam="BOS" codes={teamCodes}>
        {/* Full wide measure: this chart is the page's headline visual. */}
        <div className="mt-16 sm:mt-20">
          <ErrorBoundary label="Bench scatter">
            <Reveal>
              <BenchScatter teams={teams} leagueAvgBenchPayroll={deepBenchData.meta.leagueAvgBenchPayroll} />
            </Reveal>
          </ErrorBoundary>
        </div>

        {/* Act 2 — the evidence: every team, sortable. Full wide measure too —
            thirty rows across nine columns is exactly the content this room
            was for. */}
        <section className="mt-24 sm:mt-32">
          <SectionHead
            id="table"
            title="All thirty benches"
            deck="The same thirty teams, ranked by surplus value. Choose a sort order to compare teams; open a team card for its full view."
          />
          <ErrorBoundary label="Teams table">
            <TeamsTable teams={teams} />
          </ErrorBoundary>
        </section>

        {/* Back to the narrow measure: the tool's intro copy and its two
            panels read as prose-adjacent, not a dense data surface. */}
        <div className="mx-auto max-w-[1240px]">
          {/* A real break before Act 3 — the tool changes register from reading to doing. */}
          <div className="mt-28 border-t pt-6 sm:mt-36" style={{ borderColor: "var(--rule-2)" }}>
            <div className="text-[12px]" style={{ fontFamily: "var(--font-num)", letterSpacing: "0.14em", color: "var(--text-lo)" }}>
              The tool
            </div>
            <h2
              className="mt-3 max-w-[20ch] text-[34px] leading-[1.12] sm:text-[34px]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.01em", color: "var(--text-hi)" }}
            >
              Pick a team, and see where the model would move it.
            </h2>
            <p className="mt-3 max-w-[62ch] text-[15px] leading-[1.6]" style={{ color: "var(--text-mid)" }}>
              One selection drives both panels below. Use the rail, tap a chart point, or press Space on a focused point. Desktop chart clicks open team cards.
            </p>
          </div>

          <div className="mt-12">
            <TeamExplorer teamCodes={teamCodes} lineups={lineups} minutes={minutes} modelNote={deepBenchData.meta.starterBenchShareNote} ceiling={deepBenchData.meta.minutesCeiling} />
          </div>
        </div>
      </SelectedTeamProvider>

      <p className="mx-auto mt-24 max-w-[1240px] pb-8 text-[15px]" style={{ color: "var(--text-mid)" }}>
        What the model can see, and the seven places it cannot:{" "}
        <Link prefetch={false} href="/method" className="underline underline-offset-4" style={{ color: "var(--text-hi)" }}>
          how this was built
        </Link>
        .
      </p>
    </div>
  );
}
