import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FlagDetails } from "@/components/flags";
import { LineupOptimizer } from "@/components/LineupOptimizer";
import { MinutesPlan } from "@/components/MinutesPlan";
import { TeamFlood } from "@/components/TeamFlood";
import { TeamGrid } from "@/components/TeamGrid";
import { Num, SectionHead } from "@/components/ui";
import { fixed, signed } from "@/lib/format";
import { lineups, minutes, teamCodes, teams } from "@/lib/data";
import { teamIdentity } from "@/lib/teamColors";
import type { Team } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return teamCodes.map((code) => ({ code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const name = teamIdentity(code).name;
  return {
    title: `${name} bench — deep-bench`,
    description: `What the ${name} bench is worth in wins, what it costs, and where the model would move the lineup and the minutes.`,
    alternates: { canonical: `/teams/${code}` },
  };
}

/**
 * Where one team sits among the thirty on a single field. The ticks are
 * positioned by the field's own value; no rank or percentile is printed,
 * because neither is in the source.
 */
function LeagueStrip({ team, label, value, pick }: { team: Team; label: string; value: string; pick: (t: Team) => number }) {
  const values = teams.map(pick);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const at = (v: number) => `${max === min ? 50 : ((v - min) / (max - min)) * 100}%`;
  return (
    <div className="py-4" style={{ borderTop: "1px solid var(--rule-1)" }}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[14px]" style={{ color: "var(--text-mid)" }}>{label}</span>
        <Num className="text-[20px]" style={{ color: "var(--text-hi)" }}>{value}</Num>
      </div>
      <div className="relative mt-3 h-5" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: "var(--rule-2)" }} />
        {teams.map((t) =>
          t.team === team.team ? null : (
            <span key={t.team} className="absolute top-1 h-3 w-px" style={{ left: at(pick(t)), background: "var(--rule-4)" }} />
          ),
        )}
        <span className="absolute top-0 h-5 w-[5px] -translate-x-1/2" style={{ left: at(pick(team)), background: "var(--team)", outline: "1px solid var(--casing)" }} />
      </div>
      <div className="mt-1 flex justify-between text-[12px]" style={{ fontFamily: "var(--font-num)", color: "var(--text-lo)" }}>
        <span>league low</span>
        <span>league high</span>
      </div>
    </div>
  );
}

export default async function TeamCard({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const team = teams.find((t) => t.team === code);
  if (!team) notFound();

  const identity = teamIdentity(code);
  const index = teamCodes.indexOf(code);
  const previous = teamCodes[(index - 1 + teamCodes.length) % teamCodes.length];
  const next = teamCodes[(index + 1) % teamCodes.length];

  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-8" style={{ "--team": identity.color } as React.CSSProperties}>
      <nav aria-label="Team" className="flex items-center justify-between py-4 text-[14px]">
        <Link href={`/teams/${previous}`} className="underline-offset-4 hover:underline" style={{ color: "var(--text-mid)" }}>
          ← {teamIdentity(previous).name}
        </Link>
        <Link href={`/teams/${next}`} className="text-right underline-offset-4 hover:underline" style={{ color: "var(--text-mid)" }}>
          {teamIdentity(next).name} →
        </Link>
      </nav>

      <TeamFlood team={team} kicker="Team card" as="h1" />

      <section className="mt-16 sm:mt-20">
        <SectionHead id="league" title="Against the other twenty-nine" deck="Each strip places this team among all thirty on one measure. The marks are the other teams." />
        <div className="grid gap-x-12 lg:grid-cols-2">
          <LeagueStrip team={team} label="Bench wins above average" value={signed(team.benchWinsAboveAvg, 2)} pick={(t) => t.benchWinsAboveAvg} />
          <LeagueStrip team={team} label="Bench BPM" value={signed(team.benchBPM, 2)} pick={(t) => t.benchBPM} />
          <LeagueStrip team={team} label="Starter BPM" value={signed(team.starterBPM, 2)} pick={(t) => t.starterBPM} />
          <LeagueStrip team={team} label="Projected wins" value={fixed(team.projWins, 1)} pick={(t) => t.projWins} />
        </div>
        <p className="mt-4 text-[13px]" style={{ color: "var(--text-lo)" }}>
          Bench players tracked: <Num>{team.nBench}</Num>. Projected wins are the model&apos;s preseason projection, not a record.
        </p>
        {team.dataFlags.length > 0 && (
          <div className="mt-6">
            <FlagDetails flags={team.dataFlags} />
          </div>
        )}
      </section>

      <section className="mt-16 sm:mt-20">
        <SectionHead id="lineup-optimizer" title="Lineup optimizer" deck="The five the model would start, against the five on the floor." />
        <ErrorBoundary label="Lineup optimizer">
          <LineupOptimizer code={code} lineup={lineups[code]} />
        </ErrorBoundary>
      </section>

      <section className="mt-16 sm:mt-20">
        <SectionHead id="minutes-plan" title="Minutes plan" deck="Where the model would move each player's minutes." />
        <ErrorBoundary label="Minutes plan">
          <MinutesPlan code={code} rows={minutes[code] ?? []} />
        </ErrorBoundary>
      </section>

      <section className="mt-20 sm:mt-28">
        <SectionHead id="teams" title="Another team" deck="All thirty, by conference and division." />
        <TeamGrid teams={teams} current={code} />
      </section>
    </div>
  );
}
