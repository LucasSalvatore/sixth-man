"use client";

import { useMemo } from "react";
import type { Lineup, LineupPlayer } from "@/lib/types";
import { formatMillions, signed, sourcePrecision } from "@/lib/format";
import { teamIdentity } from "@/lib/teamColors";
import { useTween } from "@/lib/motion";
import { MicroLabel, Num } from "@/components/ui";

type Slot =
  | { kind: "common"; player: LineupPlayer }
  | { kind: "demoted"; player: LineupPlayer }
  | { kind: "promoted"; player: LineupPlayer }
  | { kind: "void" };

const byBpmThenName = (a: LineupPlayer, b: LineupPlayer) =>
  b.bpm - a.bpm || a.name.localeCompare(b.name);

/**
 * Common players take the same slot index in both cards, so they sit on one
 * horizontal line by construction rather than by measurement. The exchange
 * block below them pairs demoted against promoted, line for line.
 */
function buildSlots(lineup: Lineup): { left: Slot[]; right: Slot[]; hasVoid: boolean } {
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

  // Seven teams carry four players. Slot five is held open on both cards rather
  // than filled with a player the model never picked.
  const hasVoid = left.length < 5;
  if (hasVoid) {
    left.push({ kind: "void" });
    right.push({ kind: "void" });
  }
  return { left, right, hasVoid };
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
  if (slot.kind === "void") {
    return (
      <div
        className="flex items-center justify-center px-3 text-[12.5px]"
        style={{
          height: 48,
          border: "1px dashed var(--rule-2)",
          color: "var(--text-mid)",
        }}
      >
        Fifth slot not in the source
      </div>
    );
  }

  const { player } = slot;
  const exchangeIndex = index - commonCount;
  // Players in both fives stay put — no entrance at all. Only the exchange moves.
  const animation =
    slot.kind === "common"
      ? undefined
      : slot.kind === "demoted"
        ? `db-slide-in-left 320ms var(--ease-out) ${120 + exchangeIndex * 40}ms backwards`
        : `db-slide-in-right 360ms cubic-bezier(0.34, 1.42, 0.64, 1) ${
            120 + exchangeIndex * 40
          }ms backwards`;

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
        gridTemplateColumns: "28px minmax(0,1fr) 56px 92px",
        minHeight: 48,
        borderLeft: keyline,
        paddingLeft: 10,
        animation,
      }}
    >
      <Num className="text-[11.5px]" style={{ color: "var(--text-lo)" }}>
        {player.pos}
      </Num>

      <div className="min-w-0">
        <div
          className="text-[14.5px] leading-[1.25]"
          style={{
            fontWeight: 500,
            color: slot.kind === "demoted" ? "var(--text-mid)" : "var(--text-hi)",
          }}
        >
          {player.name}
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
      <h4
        className="text-[18px]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--text-hi)" }}
      >
        {title}
      </h4>
      <Num className="text-[11.5px]" style={{ color: "var(--text-lo)" }}>
        Lineup BPM {sourcePrecision(bpm)}
      </Num>
      <div className="mt-4 flex flex-col gap-2">
        {slots.map((slot, index) => (
          <PlayerRow
            key={slot.kind === "void" ? `void-${index}` : slot.player.name}
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

export function LineupOptimizer({
  code,
  lineup,
  minutesCount,
  dataFlag,
}: {
  code: string;
  lineup: Lineup | undefined;
  minutesCount: number;
  dataFlag: string | null;
}) {
  const identity = teamIdentity(code);
  const built = useMemo(() => (lineup ? buildSlots(lineup) : null), [lineup]);
  const gain = useTween(lineup?.gainWins ?? 0);

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
          <div className="max-w-[56ch] text-center">
            <h4
              className="text-[22px]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                color: "var(--text-hi)",
              }}
            >
              No lineup for {identity.name}.
            </h4>
            <p className="mt-4 text-[15px] leading-[1.6]" style={{ color: "var(--text-mid)" }}>
              The source&apos;s lineup table has no entry for {identity.name}, so there is nothing
              here to optimize. We will not build one — choosing five players the model never chose
              would be our lineup, not the model&apos;s. The minutes plan below covers all{" "}
              {minutesCount} {identity.name} players the model does grade.
            </p>
            <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--rule-1)" }}>
              {dataFlag ? (
                <p className="text-[13px] leading-[1.6]" style={{ color: "var(--text-lo)" }}>
                  This team also carries a data flag. In the source&apos;s words:{" "}
                  <em style={{ color: "var(--text-mid)" }}>&ldquo;{dataFlag}&rdquo;</em>
                </p>
              ) : (
                <p className="text-[13px] leading-[1.6]" style={{ color: "var(--text-lo)" }}>
                  {identity.name} carries no data flag, so the absence here is not explained
                  anywhere in the source.
                </p>
              )}
            </div>
          </div>
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
        <Card
          title="Current five"
          bpm={lineup.curBPM}
          slots={built.left}
          commonCount={commonCount}
          animKey={code}
        />

        <div
          className="flex flex-col items-center justify-center py-5 text-center lg:py-0"
          style={{ borderTop: "1px solid var(--rule-2)", borderBottom: "1px solid var(--rule-2)" }}
        >
          <MicroLabel>Wins gained</MicroLabel>
          {alreadyOptimal ? (
            <>
              <div
                className="mt-2 text-[26px] leading-tight"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  color: "var(--text-hi)",
                }}
              >
                Already optimal
              </div>
              <Num className="mt-2 text-[11.5px]" style={{ color: "var(--text-lo)" }}>
                Lineup BPM unchanged at {sourcePrecision(lineup.curBPM)}
              </Num>
            </>
          ) : (
            <>
              <Num
                className="mt-2 text-[32px] leading-none lg:text-[46px]"
                style={{ color: "var(--text-hi)" }}
              >
                {signed(gain, 2)}
              </Num>
              <Num className="mt-2 text-[11.5px]" style={{ color: "var(--text-lo)" }}>
                {sourcePrecision(lineup.curBPM)} → {sourcePrecision(lineup.optBPM)}
              </Num>
            </>
          )}
        </div>

        <Card
          title="Optimal five"
          bpm={lineup.optBPM}
          slots={built.right}
          commonCount={commonCount}
          animKey={code}
        />
      </div>

      {alreadyOptimal && (
        <p className="mt-5 text-[13px] leading-[1.6]" style={{ color: "var(--text-mid)" }}>
          <strong style={{ color: "var(--text-hi)", fontWeight: 600 }}>
            The model&apos;s optimal five is the five already on the floor.
          </strong>
        </p>
      )}

      {[...built.left, ...built.right].some(
        (slot) => slot.kind !== "void" && slot.player.salary === null,
      ) && (
        <p className="mt-5 max-w-[68ch] text-[13px] leading-[1.6]" style={{ color: "var(--text-lo)" }}>
          ‡ The source carries no 2026-27 salary for this player, so no figure is shown. See{" "}
          <a href="#note-payroll" className="underline decoration-dotted underline-offset-2">
            bench payroll is committed money only
          </a>
          .
        </p>
      )}

      {built.hasVoid && (
        <p className="mt-5 max-w-[68ch] text-[13px] leading-[1.6]" style={{ color: "var(--text-mid)" }}>
          <strong style={{ color: "var(--text-hi)", fontWeight: 600 }}>
            The source lists four players for this lineup, not five.
          </strong>{" "}
          We show four. The fifth row is left empty rather than filled with a player the model never
          picked.
        </p>
      )}

      {footer}
    </div>
  );
}
