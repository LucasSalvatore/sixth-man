"use client";

import { useState } from "react";
import type { Lineup, MinutesRow } from "@/lib/types";
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
  lineups,
  minutes,
}: {
  teamCodes: string[];
  lineups: Record<string, Lineup>;
  minutes: Record<string, MinutesRow[]>;
}) {
  const [selected, setSelected] = useState("BOS");

  const rows = minutes[selected] ?? [];

  return (
    <div>
      <div className="mb-10">
        <TeamRail codes={teamCodes} selected={selected} onSelect={setSelected} />
      </div>

      <section>
        <SectionHead
          id="lineup-optimizer"
          title="Lineup optimizer"
          deck="The five the model would start, against the five on the floor."
        />
        <Reveal>
          {/* Keyed on the selection: a team change remounts the panel so every
              animated figure re-runs from the new team's data rather than
              holding a stale value from the previous team. */}
          <LineupOptimizer key={selected} code={selected} lineup={lineups[selected]} />
        </Reveal>
      </section>

      <p
        className="mx-auto mt-16 max-w-[64ch] text-center text-[14px] leading-[1.6]"
        style={{ color: "var(--text-mid)" }}
      >
        The optimizer and the minutes plan answer different questions — who should start, and how
        the minutes should be shared — so they can legitimately disagree for the same team.
      </p>

      <section className="mt-16">
        <SectionHead
          id="minutes-plan"
          title="Minutes plan"
          deck="Where the model would move each player's minutes."
        />
        <Reveal>
          {/* Keyed on the selection for the same reason: the bars must grow from
              the new team's numbers on every change. */}
          <MinutesPlan key={selected} code={selected} rows={rows} />
        </Reveal>
      </section>
    </div>
  );
}
