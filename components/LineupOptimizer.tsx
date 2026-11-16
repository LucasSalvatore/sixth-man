import type { Lineup, LineupPlayer } from "@/lib/types";
import { formatMillions, signed, sourcePrecision } from "@/lib/format";
import { teamIdentity } from "@/lib/teamColors";
import { FlagMark } from "@/components/flags";
import { SourceText } from "@/components/SourceText";
import { MicroLabel, Num } from "@/components/ui";

type Slot = { kind: "common" | "demoted" | "promoted"; player: LineupPlayer };

const byBpmThenName = (a: LineupPlayer, b: LineupPlayer) =>
  b.bpm - a.bpm || a.name.localeCompare(b.name);

/** A merged roster: players shared by both lineups appear once. */
function buildSlots(lineup: Lineup): Slot[] {
  if (lineup.gainWins === 0) {
    return [...lineup.current].sort(byBpmThenName).map((player) => ({ kind: "common", player }));
  }
  const currentNames = new Set(lineup.current.map((p) => p.name));
  const optimalNames = new Set(lineup.optimal.map((p) => p.name));
  const common = lineup.current.filter((p) => optimalNames.has(p.name)).sort(byBpmThenName);
  const demoted = lineup.current.filter((p) => !optimalNames.has(p.name)).sort(byBpmThenName);
  const promoted = lineup.optimal.filter((p) => !currentNames.has(p.name)).sort(byBpmThenName);
  return [
    ...common.map((player) => ({ kind: "common" as const, player })),
    ...demoted.map((player) => ({ kind: "demoted" as const, player })),
    ...promoted.map((player) => ({ kind: "promoted" as const, player })),
  ];
}

function PlayerRow({ slot }: { slot: Slot }) {
  const { player, kind } = slot;
  return (
    <li
      data-lineup-player={player.name}
      data-lineup-status={kind}
      className="grid grid-cols-[minmax(0,1fr)_88px] items-center gap-x-3 gap-y-1 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_80px_108px] sm:px-5"
      style={{
        borderTop: "1px solid var(--rule-1)",
        borderLeft: kind === "promoted" ? "3px solid var(--team)" : kind === "demoted" ? "3px solid var(--rule-4)" : "3px solid transparent",
      }}
    >
      <div className="row-span-2 min-w-0 sm:row-span-1">
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]" style={{ color: "var(--text-lo)" }}>
          {kind !== "common" && (
            <span className={kind === "promoted" ? "team-text" : ""} style={{ fontWeight: 600 }}>
              {kind === "promoted" ? "In" : "Out"}
            </span>
          )}
          <span>{player.pos ?? "Position unavailable"}</span>
        </div>
        <div className="flex items-start gap-2 text-[15px] leading-snug" style={{ fontWeight: 500, color: kind === "demoted" ? "var(--text-mid)" : "var(--text-hi)" }}>
          <span data-player-name className="min-w-0 break-words">{player.name}</span>
          {player.imputed && <FlagMark reason={player.imputed} />}
        </div>
      </div>
      <div className="col-start-2 row-start-1 text-right text-[15px]">
        <Num style={{ color: "var(--text-hi)" }}>{signed(player.bpm, 1)}</Num>
        <span className="ml-1 text-[12px] sm:hidden" style={{ color: "var(--text-lo)" }}>BPM</span>
      </div>
      <div className="col-start-2 row-start-2 text-right text-[15px] sm:col-start-3 sm:row-start-1">
        {player.salary === null ? (
          <a href="/method#note-payroll" className="inline-flex min-h-8 items-center text-[12px] italic underline decoration-dotted underline-offset-2" style={{ color: "var(--text-lo)" }}>
            Unsigned&nbsp;‡
          </a>
        ) : (
          <Num style={{ color: "var(--text-hi)" }}>{formatMillions(player.salary)}</Num>
        )}
      </div>
    </li>
  );
}

export function LineupOptimizer({ code, lineup, modelNote }: { code: string; lineup: Lineup | undefined; modelNote: string }) {
  const identity = teamIdentity(code);
  const slots = lineup ? buildSlots(lineup) : null;
  const gain = lineup?.gainWins ?? 0;
  const footer = (
    <p className="mt-6 max-w-[68ch] text-[15px] leading-relaxed" style={{ color: "var(--text-lo)" }}>
      <SourceText text={modelNote} /> Gains reflect the model&apos;s minute redistribution, without measuring chemistry, spacing, or defence.
    </p>
  );

  if (!lineup || !slots) {
    return (
      <div style={{ "--team": identity.color } as React.CSSProperties}>
        <div className="flex min-h-[200px] items-center justify-center p-6" style={{ background: "var(--bg-panel)", border: "1px dashed var(--rule-2)" }}>
          <p className="max-w-[52ch] text-[15px] leading-relaxed" style={{ color: "var(--text-mid)" }}>
            The source has no lineup for {identity.name}. We show what the source has and nothing we would have to invent.
          </p>
        </div>
        {footer}
      </div>
    );
  }

  const alreadyOptimal = lineup.gainWins === 0;
  return (
    <div data-lineup-panel={code} style={{ "--team": identity.color } as React.CSSProperties}>
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--rule-2)" }}>
        <div className="flex flex-col gap-5 px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div>
            <h3 className="text-[20px]" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--text-hi)" }}>
              {identity.name} · {alreadyOptimal ? "Current five" : "Lineup changes"}
            </h3>
            <p className="mt-2 max-w-[48ch] text-[15px]" style={{ color: "var(--text-mid)" }}>
              {alreadyOptimal ? "The model keeps the current lineup." : "Shared players appear once. Out returns to the bench; In joins the starting lineup."}
            </p>
          </div>
          <div data-lineup-gain className="flex shrink-0 flex-col items-start sm:items-end">
            <MicroLabel>Wins gained</MicroLabel>
            {alreadyOptimal ? (
              <>
                <span className="mt-1 text-[20px]" style={{ fontFamily: "var(--font-display)", color: "var(--text-hi)" }}>Already optimal</span>
                <Num className="mt-1 text-[12px]" style={{ color: "var(--text-lo)" }}>Lineup BPM unchanged at {sourcePrecision(lineup.curLineupBPM)}</Num>
              </>
            ) : (
              <>
                <Num className="mt-1 text-[34px] leading-none" style={{ color: "var(--text-hi)" }}>{signed(gain, 2)}</Num>
                <Num className="mt-2 text-[12px]" style={{ color: "var(--text-lo)" }}>Lineup BPM {sourcePrecision(lineup.curLineupBPM)} → {sourcePrecision(lineup.optLineupBPM)}</Num>
              </>
            )}
          </div>
        </div>
        <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1fr)_80px_108px] gap-3 px-5 py-2 text-[12px] sm:grid" style={{ color: "var(--text-lo)" }}>
          <span>Player</span><span className="text-right">BPM</span><span className="text-right">Salary</span>
        </div>
        <ul aria-label={alreadyOptimal ? "Current lineup" : "Current and optimal lineup"}>
          {slots.map((slot) => <PlayerRow key={slot.player.name} slot={slot} />)}
        </ul>
      </div>
      {!alreadyOptimal && <p className="mt-5 text-[15px] leading-relaxed" style={{ color: "var(--text-lo)" }}>A higher-BPM player can sit if the lineup needs a different mix of guards and bigs.</p>}
      {footer}
    </div>
  );
}
