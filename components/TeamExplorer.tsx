"use client";

import { useState } from "react";
import type { Lineup, MinutesRow, Team } from "@/lib/types";
import { LineupOptimizer } from "@/components/LineupOptimizer";
import { MinutesPlan } from "@/components/MinutesPlan";
import { TeamRail } from "@/components/TeamRail";
import { Reveal, SectionHead } from "@/components/ui";

/**
 * One selection drives both panels. Boston is the default: three common players
 * and two exchanged, so the first thing a visitor sees is the exchange
 * animation's actual character rather than the largest number in the file.
 */
export function TeamExplorer({
  teamCodes,
  teams,
  lineups,
  minutes,
}: {
  teamCodes: string[];
  teams: Team[];
  lineups: Record<string, Lineup>;
  minutes: Record<string, MinutesRow[]>;
}) {
  const [selected, setSelected] = useState("BOS");

  const noLineup = new Set(teamCodes.filter((code) => !lineups[code]));
  const team = teams.find((t) => t.team === selected);
  const rows = minutes[selected] ?? [];

  return (
    <>
      <section className="mt-24 sm:mt-28">
        <SectionHead
          id="lineup-optimizer"
          title="Lineup optimizer"
          deck="The five the model would start, against the five on the floor."
        />

        <div className="mb-8">
          <TeamRail
            codes={teamCodes}
            selected={selected}
            onSelect={setSelected}
            noLineup={noLineup}
          />
        </div>

        <Reveal>
          {/* Keyed on the selection: a team change remounts the panel so every
              animated figure re-runs from the new team's data rather than
              holding a stale value from the previous team. */}
          <LineupOptimizer
            key={selected}
            code={selected}
            lineup={lineups[selected]}
            minutesCount={rows.length}
            dataFlag={team?.dataFlag ?? null}
          />
        </Reveal>
      </section>

      <section className="mt-24 sm:mt-28">
        <SectionHead
          id="minutes-plan"
          title="Minutes plan"
          deck="Where the model would move each player's minutes."
        />
        <p className="mb-6 max-w-[68ch] text-[13px] leading-[1.6]" style={{ color: "var(--text-lo)" }}>
          These two panels answer different questions — who should start, and how the minutes
          should be shared — so they can legitimately disagree for the same team.
        </p>
        <Reveal>
          {/* Keyed on the selection for the same reason as the panel above: the
              bars must grow from the new team's numbers on every change. */}
          <MinutesPlan key={selected} code={selected} rows={rows} />
        </Reveal>
      </section>
    </>
  );
}
