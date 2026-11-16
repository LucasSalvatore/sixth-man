import Link from "next/link";
import { BenchOfTheDay } from "@/components/BenchOfTheDay";
import { TeamFlood } from "@/components/TeamFlood";
import { TeamGrid } from "@/components/TeamGrid";
import { Num, SectionHead } from "@/components/ui";
import { formatSurplus, signed } from "@/lib/format";
import { lineups, teamCodes, teams } from "@/lib/data";
import { teamIdentity } from "@/lib/teamColors";

type Row = { code: string; value: string; tone?: "pos" | "neg" };

/** A ranked list is an ordering of a field, never arithmetic on it. */
function Board({ title, deck, rows }: { title: string; deck: string; rows: Row[] }) {
  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--rule-2)" }}>
      <div className="px-5 pt-5">
        <h3 className="text-[20px]" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--text-hi)" }}>
          {title}
        </h3>
        <p className="mt-1 text-[13px] leading-[1.5]" style={{ color: "var(--text-lo)" }}>{deck}</p>
      </div>
      <ol className="mt-4">
        {rows.map((row, i) => {
          const identity = teamIdentity(row.code);
          return (
            <li key={row.code} style={{ borderTop: "1px solid var(--rule-1)" }}>
              <Link
                href={`/teams/${row.code}`}
                className="flex min-h-[48px] items-center gap-3 px-5"
                style={{ "--team": identity.color } as React.CSSProperties}
              >
                <Num className="w-5 text-[12px]" style={{ color: "var(--text-lo)" }}>{i + 1}</Num>
                <span aria-hidden="true" style={{ width: 4, height: 22, background: "var(--team)", flex: "none" }} />
                <span className="min-w-0 flex-1 truncate text-[15px]" style={{ color: "var(--text-hi)", fontWeight: 500 }}>
                  {identity.name}
                </span>
                <Num
                  className="text-[15px]"
                  style={{ color: row.tone === "neg" ? "var(--neg)" : row.tone === "pos" ? "var(--pos)" : "var(--text-hi)" }}
                >
                  {row.value}
                </Num>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function FrontDoor() {
  const bySurplus = [...teams].sort((a, b) => b.benchSurplusValue - a.benchSurplusValue);
  const bargains: Row[] = bySurplus.slice(0, 5).map((t) => ({ code: t.team, value: formatSurplus(t.benchSurplusValue), tone: "pos" }));
  const overpays: Row[] = bySurplus.slice(-5).reverse().map((t) => ({ code: t.team, value: formatSurplus(t.benchSurplusValue), tone: "neg" }));
  const gains: Row[] = teamCodes
    .filter((code) => lineups[code])
    .sort((a, b) => lineups[b].gainWins - lineups[a].gainWins)
    .slice(0, 5)
    .map((code) => ({ code, value: signed(lineups[code].gainWins, 2) }));

  const bands = teamCodes.map((code) => {
    const team = teams.find((t) => t.team === code)!;
    return { code, node: <TeamFlood team={team} kicker="Bench of the day" href={`/teams/${code}`} /> };
  });

  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
      <header className="pt-10 sm:pt-16">
        <h1
          className="max-w-[16ch] text-[44px] leading-[0.98] sm:text-[84px]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "-0.03em", color: "var(--text-hi)" }}
        >
          NBA teams are bad at buying bench value.
        </h1>
        <p className="mt-6 max-w-[60ch] text-[16px] leading-[1.6] sm:text-[18px]">
          What every bench is worth in wins, what those wins cost, and where the lineups and minutes
          should go. One team a day, all thirty a click away.
        </p>
      </header>

      <div className="mt-10 sm:mt-14">
        <BenchOfTheDay bands={bands} />
      </div>

      <section className="mt-20 sm:mt-28">
        <SectionHead id="boards" title="Who is getting it right" deck="Three orderings of the same thirty benches. Every row opens that team's card." />
        <div className="grid gap-5 lg:grid-cols-3">
          <Board title="Biggest bargains" deck="Most bench value for the least money." rows={bargains} />
          <Board title="Biggest overpays" deck="Paying the most above the league's going rate." rows={overpays} />
          <Board title="Wins left on the bench" deck="What the model's optimal five would add." rows={gains} />
        </div>
        <Link href="/bench" className="mt-6 inline-block text-[15px] underline underline-offset-4" style={{ color: "var(--text-hi)" }}>
          See all thirty on the chart and in the table →
        </Link>
      </section>

      <section className="mt-20 sm:mt-28">
        <SectionHead id="teams" title="Every team" deck="Grouped by conference and division. The figure is each team's bench surplus value." />
        <TeamGrid teams={teams} />
      </section>
    </div>
  );
}
