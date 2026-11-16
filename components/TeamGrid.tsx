import Link from "next/link";
import type { Team } from "@/lib/types";
import { formatSurplus } from "@/lib/format";
import { CONFERENCES, DIVISIONS, type Division } from "@/lib/league";
import { isAchromatic, teamIdentity } from "@/lib/teamColors";

/** All thirty teams as tiles, grouped by conference and division. Each tile
 *  carries the team colour as a solid edge and links to that team's card. */
export function TeamGrid({ teams, current }: { teams: Team[]; current?: string }) {
  const byCode = new Map(teams.map((t) => [t.team, t]));

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {CONFERENCES.map((conference) => (
        <div key={conference}>
          <h3 className="text-[20px]" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--text-hi)" }}>
            {conference}
          </h3>
          {(Object.entries(DIVISIONS) as [Division, (typeof DIVISIONS)[Division]][])
            .filter(([, d]) => d.conference === conference)
            .map(([division, { teams: codes }]) => (
              <div key={division} className="mt-5">
                <div className="text-[12px]" style={{ fontFamily: "var(--font-num)", letterSpacing: "0.12em", color: "var(--text-lo)" }}>
                  {division}
                </div>
                <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-5 lg:grid-cols-1 xl:grid-cols-5">
                  {codes.map((code) => {
                    const team = byCode.get(code);
                    if (!team) return null;
                    const identity = teamIdentity(code);
                    const isCurrent = code === current;
                    return (
                      <li key={code}>
                        <Link
                          href={`/teams/${code}`}
                          aria-current={isCurrent ? "page" : undefined}
                          aria-label={`${identity.name}, bench surplus value ${formatSurplus(team.benchSurplusValue)}`}
                          className="flex items-center justify-between gap-3 px-3 py-3 sm:block"
                          style={
                            {
                              "--team": identity.color,
                              background: isCurrent ? "var(--bg-hover)" : "var(--bg-panel)",
                              border: "1px solid var(--rule-1)",
                              borderLeft: isAchromatic(code) ? "6px double var(--team)" : "6px solid var(--team)",
                            } as React.CSSProperties
                          }
                        >
                          <span className="block text-[15px]" style={{ fontFamily: "var(--font-num)", fontWeight: 500, color: "var(--text-hi)" }}>
                            {code}
                          </span>
                          <span
                            className="block text-[12.5px] sm:mt-1"
                            style={{ fontFamily: "var(--font-num)", color: team.benchSurplusValue < 0 ? "var(--neg)" : "var(--pos)" }}
                          >
                            {formatSurplus(team.benchSurplusValue)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
