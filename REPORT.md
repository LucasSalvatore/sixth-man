# deep-bench — QA report

Final verification pass before the site backs a public research post. Verification
and cleanup only: no features, no restyling, and no number was changed. Every
check below was run against `data/deep-bench-data-v2.json` on the built site.

**Status: ready to publish, with three open items** — one data-file gap, one
copy-maintenance risk, and one optional guard hardening. All three are recorded
under [Open items](#open-items). Nothing found is a correctness defect in what
the page currently displays.

---

## 1. Repo structure

```
app/
  layout.tsx          Fonts, metadata, skip link, no-JS reveal fallback
  page.tsx            Composition: the three acts + methodology + footer
  globals.css         Design tokens, focus ring, reduced-motion collapse, keyframes
components/
  Hero.tsx            The argument headline + three count-up stats
  BenchScatter.tsx    The hero visual (payroll x bench value, 30 points)
  TeamsTable.tsx      All thirty benches, sortable, diverging bar, flag gutter
  TeamRail.tsx        The one team selector driving both panels (radiogroup)
  TeamExplorer.tsx    Holds the selection; keys both panels on it
  LineupOptimizer.tsx Current five vs optimal five, wins gained
  MinutesPlan.tsx     Current vs optimal minutes per player
  Methodology.tsx     Quoted formulas, flag legend, seven reader-side notes
  flags.tsx           The two imputation marks (shared by table + both panels)
  ui.tsx              SectionHead, MicroLabel, Num, Money, Reveal, GhostSized
lib/
  data.ts             The only import of the JSON; re-exports teams/lineups/minutes
  types.ts            Types mirroring the v2 schema
  format.ts           Display-only formatting (millions, signs, source precision)
  motion.ts           useReducedMotion, useCountUp, useReveal, useFlip
  teamColors.ts       Team identity colours, contrast-floored for near-black
scripts/
  check-data.mjs      The build-time data guard (runs on prebuild)
data/
  deep-bench-data-v2.json   Single source of truth
```

## 2. Which JSON section powers which view

| JSON section | Powers | Notes |
| --- | --- | --- |
| `teams[]` | Hero stats, the scatter (all 30 points), the whole table | `benchSurplusValue` drives the default sort; `dataFlags` drives the table's flag gutter |
| `lineups{}` | Lineup optimizer | `curLineupBPM` / `optLineupBPM` are printed at source precision; `gainWins` is the headline figure |
| `minutes{}` | Minutes plan | `delta` is rendered as given, never recomputed; `imputed` drives the in-row flag mark |
| `meta` | Methodology | `winsFormula`, `benchSurplusFormula` and `season_source` are quoted verbatim; the seven `disclosures` are rewritten reader-side |

One selection (`TeamExplorer`) drives both panels; the table and scatter read
`teams[]` independently.

## 3. The nine invariants the guard enforces

`scripts/check-data.mjs` runs on `prebuild`, so a bad data swap fails the build
rather than reaching the page.

| # | Invariant | Why it matters |
| --- | --- | --- |
| 1 | `teams` is a 30-entry array | The league is 30 teams |
| 2 | `projWins` sums to 1230 (±0.5) | Projections must describe a real 82-game season |
| 3 | `benchWinsAboveAvg` sums to 0 (±0.05) | Measured against average, so it has to cancel |
| 4 | Every team has a non-null `benchSurplusValue` | The column has no undefined state |
| 5 | `benchSurplusValue` sums to $0 (±$0.5M) | Measured against the league's own pricing, so it cancels |
| 6 | `dataFlags` entries total 22 | Every estimated player stays disclosed |
| 7 | Every `dataFlags.reason` is a known value | A new reason can't render as an unlabelled flag |
| 8 | No lineup has a negative `gainWins` | An "optimal" five can't be worse than the current one |
| 9 | `curLineupBPM` equals that team's `starterBPM` (±0.01) | The lineup panel and the table must agree about the same five players |

Checks 3 and 5 refuse to evaluate when the field is missing, so a dropped column
fails loudly instead of passing vacuously as a sum of zeros.

## 4. Data coverage

- **298 players** priced across 30 teams (298 `minutes` rows, 298 unique names).
- **22 are estimated (7.4%)**, and all 22 are disclosed rather than dropped:
  - **17 `rookie_no_history`** — a modeled placeholder, *not a real stat*.
  - **5 `returning_from_injury`** — a real prior-season BPM reused as a prior
    (Haliburton, Lillard, VanVleet, Irving, Lyles).
- **17 of 30 teams** carry at least one flag; five carry two (CHA, DAL, UTA, BKN, SAC).
- Every lineup player also appears in that team's `minutes` roster (191 unique
  lineup names, all a subset of the 298).
- 28 teams price 5 bench players, 2 price 4 (MIA, IND) — expected, and the
  source's `starterBenchShareNote` states bench share stays 1/3 regardless.

## 5. Verification results

### Rendering integrity — pass

- **No component computes a displayed number.** Every arithmetic site in
  `components/` was reviewed and classified: sort comparators
  (`b.bpm - a.bpm`), chart geometry (`row.cur / DOMAIN * 100`), and animation
  stagger (`index * 14`). None produces a shown value.
- Every rendered table cell was compared against the JSON for **all 30 teams**
  across six numeric columns — bench wins, starter BPM, bench BPM, projected
  wins, payroll, surplus. **Zero mismatches.**
- The minutes `delta` renders the source field; `opt - cur` is never computed.
- **All 22 `dataFlags` entries render.** Each of the 17 flagged teams was
  expanded and its entries matched player-for-player against the JSON.
- The two reasons are distinct on **four channels**, so the difference survives
  greyscale and colour-blindness: glyph (`◆` vs `⟲`), colour (amber `--flag` vs
  steel `--prior`), border style (dashed vs solid), and label ("modeled" vs
  "prior season").
- Imputed players are marked **inside the lineup cards** and **inside the minutes
  rows**, not only in the table.
- `benchSurplusValue` renders signed for **all 30 teams** — no blanks, no
  em-dashes. 17 positive, 13 negative, none zero, none null.

### The stale-value bug — pass

- 10 rapid switches at ~110ms (mid-animation), then settle: the gain figure
  matched the final team exactly.
- A → B → immediately back to A: A showed A's values, not a blend or a carry-over.
- Stepped through 14 teams asserting **both** panels each time — gain (or
  "Already optimal" for the six zero-gain teams), both lineup BPMs at source
  precision including negatives (SAC −1.88 → −1.06), the current five by name,
  the full minutes roster in its declared sort order, and a live non-zero bar.
  **Zero mismatches.**
- Mechanism confirmed in source: `TeamExplorer.tsx` renders
  `<LineupOptimizer key={selected} …>` and `<MinutesPlan key={selected} …>`, so a
  team change remounts both and every animation re-runs from the new data.

### Mobile and accessibility — pass (one fix applied)

- **No page-level horizontal scroll at 375px**, measured at five scroll depths
  (`scrollWidth` 375 = `innerWidth` 375). The table scrolls inside its own
  container (858px content in a 341px viewport) without pushing the body.
- **Scatter tap targets: fixed.** They measured **30.5px**, under the 32px floor.
  The invisible hit circle went from `r=17` to `r=18.5` viewBox units, now
  measuring **33.2px**. No visual change — the target is transparent.
- Tapping a point fills the detail card (team, payroll, wins above average,
  surplus); tapping a second point updates it.
- All five annotated teams (BOS, POR, DEN, SAS, BKN) are present, inside the plot
  area, and **non-overlapping** at 375px.
- **Focus is visible** on the team selector radios, the table sort buttons, and
  the scatter points — a 2px outline with a casing shadow, taking the live team's
  colour. Scatter arrow-key traversal verified: left/right walk by payroll,
  up/down by bench value, `End` → Portland (max payroll), `Home` → Denver (min).
- **Reduced motion** collapses cleanly: all three reveal blocks at opacity 1, all
  30 points rendered, hero stats showing final values rather than counting.
- **Tabular digits align exactly.** Right-edge variance measured across all 30
  rows: **0.00px in every numeric column**, including negatives (U+2212) and the
  signed surplus column.
- Footer contains only the "Lucan Labs" mark — 0 links, 0 external scripts, no
  analytics or tracking anywhere.

### Cleanup — done

Removed, all verified unreachable against v2:

- `useTween`, `useMounted`, `useEvent` (`lib/motion.ts`) — superseded, zero callers.
- `formatAxisMillions` (`lib/format.ts`) — zero callers.
- `--dur-fast` / `--dur-mid` / `--dur-slow` (`globals.css`) — defined, never referenced.
- The `noLineup` set, its prop threading through `TeamRail`, its dotted-underline
  styling and its `aria-describedby` hint — v1 had six teams with no lineup; v2
  has all 30, so the set was always empty.
- The `"Fifth slot not in the source"` void-slot row and its `hasVoid` plumbing —
  v1 had seven four-player lineups; every v2 lineup has exactly five.

No leftover v1 references remain: `costPerBenchWin`, singular `dataFlag`, the
removed `.gp` field, and the deleted v1 data file are all absent from the source.
`tsc --noEmit` and `next lint` are both clean.

Kept deliberately: the `if (!lineup)` branch in `LineupOptimizer` is error
handling, not dead code — it prevents a blank panel if a future refresh drops a
team, and it degrades honestly ("we show what the source has").

---

## Open items

Three things to decide before or shortly after the post. None blocks publishing.

**1. `meta.leagueAvgBenchPayroll` does not exist in the data file.**
The QA brief asked that the scatter's average reference line *read* this field
rather than compute it. The field is absent from `meta`, so it cannot be read —
and the page does not compute one either: the scatter's only reference line is
**y = 0**, labelled "League-average bench", which is a real anchor (a bench worth
zero wins above average), not a derived mean. So nothing on the page is currently
wrong. If a vertical *payroll* average line is wanted, the number belongs in the
data file, not the frontend. For reference, the mean bench payroll is **$38.84M**,
which coincides with the **$38.8M** intercept already documented in
`meta.benchSurplusFormula` — they agree because mean `benchWinsAboveAvg` is 0 by
construction (guard invariant 3). I did not add the field or compute the value.

**2. The hero's prose numbers are hardcoded literals.**
The three hero *stats* are read from the JSON on the server, but the sentence
above them ("a correlation of 0.25 … +1.9 wins … for $26.4m … $74.0m … +0.6")
is literal text in `components/Hero.tsx`. All five values were checked and are
**correct against v2 today**. The risk is a future refresh moving the data while
the sentence silently stays put. Options: derive them, or add a guard assertion
pinning those five figures.

**3. The guard does not assert lineup completeness.**
It checks `gainWins` and `curLineupBPM` for the lineups that exist, but not that
all 30 teams have a lineup or that each has five players. Now that the v1
fallbacks are gone this is worth adding — two lines. It is not urgent: a missing
team still renders the honest empty state, and an asymmetric lineup renders the
rows the source actually lists, so neither case crashes or fabricates a player.

---

## How to re-run these checks

```
npm run check-data     # the nine data invariants
npm run build          # runs the guard, then builds
npx next lint          # lint
npx tsc --noEmit       # types
```

The rendering, stale-value and accessibility checks were run with Playwright
against a local dev server; they are measurement scripts rather than a committed
test suite. Standing them up as a `npm test` target is the natural next step if
this page is going to keep changing.
