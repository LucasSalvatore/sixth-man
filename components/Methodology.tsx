import type { DeepBenchMeta } from "@/lib/types";

/**
 * The five source disclosures, rewritten from the reader's side. Each note
 * corresponds one-to-one with an entry in meta.disclosures; the source's own
 * definitions are quoted verbatim above them, unedited.
 */
const NOTES: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "note-excluded",
    title: "Twelve teams are understated here",
    body: (
      <>
        Twenty-two players — 2026 rookies, and players who missed the whole season — have no
        2025-26 BPM. The model cannot price them, so it leaves them out. Twelve teams lose real
        value that way. Wherever a team is affected you will see an amber flag beside its tricode
        in the table; open it and it names the players the source lists for that team. Read those
        teams&apos; starter numbers as a floor, not as a verdict.
      </>
    ),
  },
  {
    id: "note-payroll",
    title: "Bench payroll is committed money only",
    body: (
      <>
        Eleven free agents are unsigned, so they carry no 2026-27 salary at all. Every payroll
        figure on this page is what a team has already committed, not what its bench will finally
        cost. Where a lineup card shows a player with no salary it says &ldquo;Unsigned&rdquo;
        rather than printing a zero — and no card totals its salaries, because a total that
        quietly skipped those players would be wrong in a way you could not see.
      </>
    ),
  },
  {
    id: "note-bpm",
    title: "Every value here is last season's BPM",
    body: (
      <>
        One number stands in for a player: box plus/minus from 2025-26. It knows nothing about
        whether he fits a scheme, whether the lineup around him works, whether he is being coached
        well, or whether he is about to get better. A twenty-two-year-old on the way up and a
        thirty-four-year-old on the way down look identical to this model if last season looked the
        same.
      </>
    ),
  },
  {
    id: "note-cost",
    title: "Why fifteen cost cells are blank",
    body: (
      <>
        The source records no cost per bench win for fifteen teams, and those cells show an em
        dash. Its own note says the figure is undefined for a bench at or below average — which
        covers fourteen of them. Atlanta is blank at +0.04, just above average, and the source does
        not say why. So we show the em dash and leave it unexplained rather than inventing a reason
        that fits fourteen teams and not the fifteenth. An em dash is not a zero and not a bargain;
        it means the source carries no number. Sort by that column and the fifteen gather below a
        labelled divider instead of scattering through the order.
      </>
    ),
  },
  {
    id: "note-linear",
    title: "The optima are deliberately extreme",
    body: (
      <>
        The optimizer is linear. With no penalty for fatigue, foul trouble or a bad night, it will
        push a good player to the ceiling and a weak one to the floor. That is why 141 of the 276
        minute lines land on exactly 36.0, and why the minutes chart draws that ceiling as a line
        rather than hiding it. Read each bar for direction and size — this player should be playing
        meaningfully more, that one meaningfully less — and not as a rotation you could hand to a
        coach.
      </>
    ),
  },
];

export function Methodology({ meta }: { meta: DeepBenchMeta }) {
  return (
    <div>
      <div
        className="mb-10 p-5"
        style={{ background: "var(--bg-raised)", border: "1px solid var(--rule-1)" }}
      >
        <div
          className="mb-3 text-[11.5px]"
          style={{ fontWeight: 500, letterSpacing: "0.055em", color: "var(--text-lo)" }}
        >
          Quoted from the source file:
        </div>
        <div
          className="flex flex-col gap-2 text-[13px] leading-[1.55]"
          style={{ fontFamily: "var(--font-num)", color: "var(--text-mid)" }}
        >
          <p>{meta.winsFormula}</p>
          <p>Bench wins metric: {meta.benchWinsMetric}</p>
          <p>Source: {meta.season_source}</p>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-x-16">
        {NOTES.map((note) => (
          <section key={note.id} id={note.id}>
            <div aria-hidden="true" style={{ width: 24, height: 1, background: "var(--rule-2)" }} />
            <h3
              className="mt-3 text-[17px]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                color: "var(--text-hi)",
              }}
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
