import type { DeepBenchMeta } from "@/lib/types";
import { FlagLegend } from "@/components/flags";

/**
 * The seven source disclosures, rewritten from the reader's side. Each note maps
 * to one entry in meta.disclosures; the source's own formula definitions are
 * quoted verbatim above, unedited.
 */
const NOTES: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "note-imputed",
    title: "Twenty-two players are estimated, and marked wherever they appear",
    body: (
      <>
        Twenty-two players had no 2025-26 box score — seventeen unproven rookies and five who
        missed the whole season. None are silently dropped. The five returning veterans (Haliburton,
        Lillard, VanVleet, Irving, Lyles) carry their last healthy season&apos;s real BPM as a
        prior; the seventeen rookies get a modeled placeholder, not a real stat. Every one is
        marked with a flag — steel for a real prior, amber for a modeled guess — beside the
        player&apos;s name in the table, the lineup cards, and the minutes plan.
      </>
    ),
  },
  {
    id: "note-payroll",
    title: "Bench payroll is committed money only",
    body: (
      <>
        Eleven free agents are unsigned, so they carry no confirmed 2026-27 salary. Every payroll
        figure here is what a team has already committed — a lower bound, not the final bill. Where
        a lineup card shows a player with no salary it says &ldquo;Unsigned&rdquo; rather than
        printing a zero, and no card totals its salaries, because a total that quietly skipped those
        players would be wrong in a way you could not see.
      </>
    ),
  },
  {
    id: "note-bpm",
    title: "Every value is one season of box score",
    body: (
      <>
        A single number stands in for a player: box plus/minus from one season — or one prior
        season, for the estimated players. It is blind to fit, to the lineup around him, to
        coaching, and to how a player changed between seasons. A young player on the way up and a
        veteran on the way down look identical to this model if their last season looked the same.
      </>
    ),
  },
  {
    id: "note-surplus",
    title: "Surplus is measured against the league, not the market",
    body: (
      <>
        Surplus value asks a narrow question: given how the league as a whole is currently paying
        for bench production, is this team over or under paying for what it gets? It is a regression
        on this dataset — about <em>$38.8m plus $3.24m per win of bench value</em> — not an external
        market valuation. A positive number is a bargain relative to the league&apos;s own revealed
        pricing, not an absolute dollar-per-win truth.
      </>
    ),
  },
  {
    id: "note-constraints",
    title: "The optimal five is position-constrained",
    body: (
      <>
        The lineup swap is not simply the five highest-BPM players. It is constrained to two or
        three guards and one or two bigs, using last-season position labels — and a rookie with no
        position history is treated as a neutral wing. That is why an optimal five can leave a
        higher-rated player on the bench: the model is filling positions, not stacking a box score.
      </>
    ),
  },
  {
    id: "note-linear",
    title: "The minutes optima are deliberately extreme",
    body: (
      <>
        The minutes model is linear, with a hard 36-minute ceiling and an 8-minute floor, so its
        answers pile up at those bounds. Read each bar for direction and size — this player should
        play meaningfully more, that one meaningfully less — and treat it as an upper bound on the
        available gain, not a rotation you could hand to a coach.
      </>
    ),
  },
  {
    id: "note-roster",
    title: "Rosters are an early-August 2026 snapshot",
    body: (
      <>
        Who plays for whom reflects a late-July / early-August 2026 offseason snapshot, checked
        against public transaction trackers for every major trade. Unsigned restricted free
        agents&apos; teams remain projections, so a summer move after that snapshot will not be
        reflected here.
      </>
    ),
  },
];

export function Methodology({ meta }: { meta: DeepBenchMeta }) {
  return (
    <div>
      <div className="mb-10 p-5" style={{ background: "var(--bg-raised)", border: "1px solid var(--rule-1)" }}>
        <div
          className="mb-3 text-[11.5px]"
          style={{ fontWeight: 500, letterSpacing: "0.04em", color: "var(--text-lo)" }}
        >
          Quoted from the source file:
        </div>
        <div
          className="flex flex-col gap-2 text-[13px] leading-[1.55]"
          style={{ fontFamily: "var(--font-num)", color: "var(--text-mid)" }}
        >
          <p>{meta.winsFormula}</p>
          <p>{meta.benchSurplusFormula}</p>
          <p>Source: {meta.season_source}</p>
        </div>
      </div>

      <div className="mb-10">
        <div className="mb-3">
          <span className="text-[11.5px]" style={{ fontWeight: 500, letterSpacing: "0.04em", color: "var(--text-lo)" }}>
            The two flag marks
          </span>
        </div>
        <FlagLegend />
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-x-16">
        {NOTES.map((note) => (
          <section key={note.id} id={note.id}>
            <div aria-hidden="true" style={{ width: 24, height: 1, background: "var(--rule-2)" }} />
            <h3
              className="mt-3 text-[17px]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--text-hi)" }}
            >
              {note.title}
            </h3>
            <p className="mt-2 max-w-[58ch] text-[15px] leading-[1.62]">{note.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
