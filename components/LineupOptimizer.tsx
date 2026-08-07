"use client";

import { useMemo } from "react";
import type { Lineup, LineupPlayer } from "@/lib/types";
import { formatMillions, signed, sourcePrecision } from "@/lib/format";
import { teamIdentity } from "@/lib/teamColors";
import { useCountUp } from "@/lib/motion";
import { FlagMark } from "@/components/flags";
import { MicroLabel, Num } from "@/components/ui";

type Slot =
  | { kind: "common"; player: LineupPlayer }
  | { kind: "demoted"; player: LineupPlayer }
  | { kind: "promoted"; player: LineupPlayer };

const byBpmThenName = (a: LineupPlayer, b: LineupPlayer) =>
  b.bpm - a.bpm || a.name.localeCompare(b.name);

function buildSlots(lineup: Lineup): { left: Slot[]; right: Slot[] } {
  const currentNames = new Set(lineup.current.map((p) => p.name));
  const optimalNames = new Set(lineup.optimal.map((p) => p.name));

  const common = lineup.current.filter((p) => optimalNames.has(p.name)).sort(byBpmThenName);
  const demoted = lineup.current.filter((p) => !optimalNames.has(p.name)).sort(byBpmThenName);
  const promoted = lineup.optimal.filter((p) => !currentNames.has(p.name)).sort(byBpmThenName);

  const left: Slot[] = [
    ...common.map((player) => ({ kind: "common" as const, player })),
    ...demoted.map((player) => ({ kind: "demoted" as const, player })),
  ];
  const right: Slot[] = [
    ...common.map((player) => ({ kind: "common" as const, player })),
    ...promoted.map((player) => ({ kind: "promoted" as const, player })),
  ];

  // Both cards always hold as many rows as the source lists for that side; a
  // player is never fabricated to fill a slot.
  return { left, right };
}

function PlayerRow({
  slot,
  index,
  commonCount,
  animKey,
}: {
  slot: Slot;
  index: number;
  commonCount: number;
  animKey: string;
}) {
  const { player } = slot;
  const exchangeIndex = index - commonCount;
  // Players in both fives stay put — no entrance. Only the exchange moves.
  const animation =
    slot.kind === "common"
      ? undefined
      : slot.kind === "demoted"
        ? `db-slide-in-left 320ms var(--ease-out) ${120 + exchangeIndex * 40}ms backwards`
        : `db-slide-in-right 360ms cubic-bezier(0.34, 1.42, 0.64, 1) ${120 + exchangeIndex * 40}ms backwards`;

  const keyline =
    slot.kind === "promoted"
      ? "2px solid var(--team)"
      : slot.kind === "demoted"
        ? "2px solid var(--rule-3)"
        : "2px solid transparent";

  return (
    <div
      key={`${animKey}-${player.name}`}
      className="grid items-center gap-2"
      style={{
        gridTemplateColumns: "30px minmax(0,1fr) 56px 92px",
        minHeight: 48,
        borderLeft: keyline,
        paddingLeft: 10,
        animation,
      }}
    >
      <Num className="text-[11.5px]" style={{ color: "var(--text-lo)" }}>
        {player.pos ?? "—"}
      </Num>

      <div className="min-w-0">
        <div
          className="flex items-center gap-1.5 text-[14.5px] leading-[1.25]"
          style={{ fontWeight: 500, color: slot.kind === "demoted" ? "var(--text-mid)" : "var(--text-hi)" }}
        >
          <span className="truncate">{player.name}</span>
          {player.imputed && <FlagMark reason={player.imputed} />}
        </div>
        {slot.kind !== "common" && (
          <span
            className={`text-[11.5px] ${slot.kind === "promoted" ? "team-text" : ""}`}
            style={slot.kind === "demoted" ? { color: "var(--text-lo)" } : undefined}
          >
            {slot.kind === "promoted" ? "In" : "Out"}
          </span>
        )}
      </div>

      <Num className="text-right text-[14.5px]" style={{ color: "var(--text-hi)" }}>
        {signed(player.bpm, 1)}
      </Num>

      <div className="text-right">
        {player.salary === null ? (
          <a
            href="#note-payroll"
            className="text-[12.5px] italic underline decoration-dotted underline-offset-2"
            style={{ color: "var(--text-lo)" }}
          >
            Unsigned&nbsp;‡
          </a>
        ) : (
          <Num className="text-[14.5px]" style={{ color: "var(--text-hi)" }}>
            {formatMillions(player.salary)}
          </Num>
        )}
      </div>
    </div>
  );
}

function Card({
  title,
  bpm,
  slots,
  commonCount,
  animKey,
}: {
  title: string;
  bpm: number;
  slots: Slot[];
  commonCount: number;
  animKey: string;
}) {
  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--rule-2)", padding: 20 }}>
      <h4 className="text-[18px]" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--text-hi)" }}>
        {title}
      </h4>
      <Num className="text-[11.5px]" style={{ color: "var(--text-lo)" }}>
        Lineup BPM {sourcePrecision(bpm)}
      </Num>
      <div className="mt-4 flex flex-col gap-2">
        {slots.map((slot, index) => (
          <PlayerRow
            key={slot.player.name}
            slot={slot}
            index={index}
            commonCount={commonCount}
            animKey={animKey}
          />
        ))}
      </div>
    </div>
  );
}

export function LineupOptimizer({ code, lineup }: { code: string; lineup: Lineup | undefined }) {
  const identity = teamIdentity(code);
  const built = useMemo(() => (lineup ? buildSlots(lineup) : null), [lineup]);
  // Counts up on every team change (the panel is remounted on selection).
  const gain = useCountUp(lineup?.gainWins ?? 0, { duration: 620 });

  const footer = (
    <p className="mt-6 max-w-[68ch] text-[13px] leading-[1.6]" style={{ color: "var(--text-lo)" }}>
      Lineups are constrained to two or three guards and one or two bigs. Starters are modelled at
      32 minutes and bench players at 16. Gains reflect minute redistribution only — not chemistry,
      not spacing, not defence.
    </p>
  );

  if (!lineup || !built) {
    return (
      <div style={{ "--team": identity.color } as React.CSSProperties}>
        <div
          className="flex min-h-[320px] items-center justify-center p-6"
          style={{ background: "var(--bg-panel)", border: "1px dashed var(--rule-2)" }}
        >
          <p className="max-w-[52ch] text-center text-[15px] leading-[1.6]" style={{ color: "var(--text-mid)" }}>
            The source has no lineup for {identity.name}. We show what the source has and nothing we
            would have to invent.
          </p>
        </div>
        {footer}
      </div>
    );
  }

  const commonCount = built.left.filter((s) => s.kind === "common").length;
  const alreadyOptimal = lineup.gainWins === 0;

  return (
    <div style={{ "--team": identity.color } as React.CSSProperties}>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_168px_1fr]">
        <Card title="Current five" bpm={lineup.curLineupBPM} slots={built.left} commonCount={commonCount} animKey={code} />

        <div
          className="flex flex-col items-center justify-center py-5 text-center lg:py-0"
          style={{ borderTop: "1px solid var(--rule-2)", borderBottom: "1px solid var(--rule-2)" }}
        >
          <MicroLabel>Wins gained</MicroLabel>
          {alreadyOptimal ? (
            <>
              <div
                className="mt-2 text-[26px] leading-tight"
                style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--text-hi)" }}
              >
                Already optimal
              </div>
              <Num className="mt-2 text-[11.5px]" style={{ color: "var(--text-lo)" }}>
                Lineup BPM unchanged at {sourcePrecision(lineup.curLineupBPM)}
              </Num>
            </>
          ) : (
            <>
              <Num className="mt-2 text-[32px] leading-none lg:text-[46px]" style={{ color: "var(--text-hi)" }}>
                {signed(gain, 2)}
              </Num>
              <Num className="mt-2 text-[11.5px]" style={{ color: "var(--text-lo)" }}>
                {sourcePrecision(lineup.curLineupBPM)} → {sourcePrecision(lineup.optLineupBPM)}
              </Num>
            </>
          )}
        </div>

        <Card title="Optimal five" bpm={lineup.optLineupBPM} slots={built.right} commonCount={commonCount} animKey={code} />
      </div>

      {alreadyOptimal ? (
        <p className="mt-5 text-[13px] leading-[1.6]" style={{ color: "var(--text-mid)" }}>
          <strong style={{ color: "var(--text-hi)", fontWeight: 600 }}>
            The model&apos;s optimal five is the five already on the floor.
          </strong>
        </p>
      ) : (
        <p className="mt-5 text-[13px] leading-[1.6]" style={{ color: "var(--text-lo)" }}>
          A higher-BPM player can sit if the five needs a different mix of guards and bigs.
        </p>
      )}

      {footer}
    </div>
  );
}
