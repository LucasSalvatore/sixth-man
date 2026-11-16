"use client";

import { useEffect, useState } from "react";
import type { Team } from "@/lib/types";
import { TeamFlood } from "@/components/TeamFlood";

/** Render one source-backed band. Calendar selection changes no numeric value. */
export function BenchOfTheDay({ teams, initialIndex }: { teams: Team[]; initialIndex: number }) {
  const [index, setIndex] = useState(initialIndex);
  useEffect(() => {
    const day = Math.floor(Date.now() / 86_400_000);
    setIndex(day % teams.length);
  }, [teams.length]);
  const team = teams[index];
  return (
    <div data-bench-of-the-day={team.team}>
      <TeamFlood team={team} kicker="Bench of the day" href={`/teams/${team.team}`} />
    </div>
  );
}
