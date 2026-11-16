import Link from "next/link";
import type { Team } from "@/lib/types";
import { formatMillions, formatSurplus, signed } from "@/lib/format";
import { conferenceOf, divisionOf } from "@/lib/league";
import { teamIdentity } from "@/lib/teamColors";

/**
 * The one loud element on a screen: a full band of the team's own colour with
 * its bench surplus value as the lead numeral. Text sits on the band in the
 * near-black casing colour, which clears 4.5:1 against all thirty team colours.
 * Every figure is a direct field read.
 */
export function TeamFlood({
  team,
  kicker,
  href,
  as: Heading = "h2",
}: {
  team: Team;
  kicker: string;
  /** When set, the band ends with a link to the team card. */
  href?: string;
  as?: "h1" | "h2";
}) {
  const identity = teamIdentity(team.team);
  const overpaying = team.benchSurplusValue < 0;
  const ink = "var(--casing)";

  return (
    <section
      data-team-flood={team.team}
      className="px-5 py-7 sm:px-10 sm:py-10"
      style={{ background: identity.color, color: ink }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[12.5px]" style={{ fontFamily: "var(--font-num)", letterSpacing: "0.1em" }}>
        <span>{kicker}</span>
        <span>
          {team.team} · {conferenceOf(team.team)} · {divisionOf(team.team)}
        </span>
      </div>

      <Heading
        className="mt-4 text-[30px] leading-[1.05] sm:text-[44px]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "-0.02em" }}
      >
        {identity.name}
      </Heading>

      <div
        className="mt-2 leading-[0.95]"
        style={{ fontFamily: "var(--font-num)", fontWeight: 500, letterSpacing: "-0.04em", fontSize: "clamp(64px, 15vw, 188px)" }}
      >
        {formatSurplus(team.benchSurplusValue)}
      </div>
      <p className="mt-3 max-w-[52ch] text-[15px] leading-[1.5] sm:text-[17px]" style={{ fontWeight: 500 }}>
        Bench surplus value — {overpaying ? "paying more" : "paying less"} than the league&apos;s own
        going rate for a bench this good.
      </p>

      <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-5 sm:grid-cols-4" style={{ borderColor: "color-mix(in oklab, var(--casing) 35%, transparent)" }}>
        {[
          ["Bench wins above average", signed(team.benchWinsAboveAvg, 2)],
          ["Bench payroll", formatMillions(team.benchPayroll)],
          ["Fair-market bench payroll", formatMillions(team.fairMarketBenchPayroll)],
          ["Projected wins", team.projWins.toFixed(1)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-[12.5px]" style={{ fontWeight: 600 }}>{label}</dt>
            <dd className="mt-1 text-[22px] sm:text-[26px]" style={{ fontFamily: "var(--font-num)", fontWeight: 500 }}>{value}</dd>
          </div>
        ))}
      </dl>

      {href && (
        <Link
          href={href}
          className="mt-7 inline-block text-[15px] underline underline-offset-4"
          style={{ color: ink, fontWeight: 600, "--team": "var(--casing)" } as React.CSSProperties}
        >
          Open the {identity.name} team card →
        </Link>
      )}
    </section>
  );
}
