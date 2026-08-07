# sixth-man

What each NBA bench is worth in wins, what those wins cost, and where the
lineups and minutes should go

## deep-bench

A static Next.js app under the Lucan Labs brand. No backend, no database, no
API routes — every figure is read at build time from
[`data/deep-bench-data-v2.json`](./data/deep-bench-data-v2.json).

### What's on the page

The page is three acts of deliberately unequal weight:

- **The argument** — the headline claim (NBA teams are bad at buying bench
  value) and the chart that carries it: a scatter of bench payroll against
  bench wins above average, one point per team in that team's own colour, with
  Boston, Portland, Denver, San Antonio and Brooklyn annotated directly on the
  chart.
- **The evidence** — all thirty benches in a sortable table, default-sorted by
  surplus value, with an inline diverging bar per row and a flag marker for
  every team carrying an imputed player.
- **The tool** — a lineup optimizer (current five against the model's optimal
  five, with the wins gained between them) and a minutes plan, both driven by
  one team selector.
- **How this was built** — the source's own formula definitions, quoted, plus
  the seven limitations in plain language.

Twenty-two players had no 2025-26 box score and are estimated rather than
dropped. Two kinds of estimate are marked distinctly wherever the player
appears — a steel `⟲` for a real prior-season stat reused as a prior, an amber
`◆` for a modeled placeholder that is not a real stat.

### Data integrity

No BPM, salary, win, gain, surplus, or minute value is generated, modified,
estimated, or recomputed anywhere in this app. Every displayed number is a
direct field read from the JSON; components perform no averaging, summing, or
formula. Only presentation changes (dollars shown in millions, a true minus
glyph, explicit `+`/`−` signs, fixed decimal places).

The corrected data file serialised absent positions as bare `NaN`, which is not
valid JSON. Those 21 tokens (all the `pos` field of imputed players) are stored
as `null` so the file parses; no numeric value is touched.

### The data guard

`scripts/check-data.mjs` validates the data file and **fails the build** if any
invariant breaks. It runs automatically before every build (the `prebuild`
script), so it is the permanent defense against a bad data swap — the September
refresh included. A refresh that quietly breaks the league identity, drops a
field, or loses a disclosure stops the build here instead of shipping wrong
numbers to the page.

```
npm run build                   # runs the guard first, then builds
npm run check-data              # check the canonical data file on its own
npm run check-data <path>       # check a specific file
```

It enforces:

| Invariant | Why |
| --- | --- |
| `projWins` sums to 1230 (±0.5) | The projections must describe a real 82-game season |
| `benchWinsAboveAvg` sums to 0 (±0.05) | Measured against average, so it has to cancel |
| `benchSurplusValue` sums to $0 (±$0.5M) | Measured against the league's own pricing, so it cancels |
| Every team has a non-null `benchSurplusValue` | The column has no undefined state |
| `dataFlags` entries total 22 | Every excluded or imputed player stays disclosed |
| Every `dataFlags.reason` is a known value | Guards against a new reason rendering as an unlabelled flag |
| No lineup has a negative `gainWins` | An "optimal" five cannot be worse than the current one |
| `curLineupBPM` equals that team's `starterBPM` (±0.01) | The two files must agree about the same five players |

The sum checks refuse to evaluate when a field is missing, so an absent column
fails loudly rather than passing vacuously as a sum of zeros.

### Run locally

```
npm install
npm run dev
```

Open http://localhost:3000.

### Build

```
npm run build
```

### Tests

```
npm test
```

A committed Playwright suite (`tests/`) covers what used to be ad-hoc QA
scripts: clicking through every scatter point and every rail cell without
the table or chart ever emptying or flickering, rapid interleaved
rail-and-scatter selection never settling on a stale value, 375px mobile
having no horizontal overflow, and keyboard/reduced-motion operability. It
starts its own dev server on port 3900, so a data refresh can be checked with
`npm test` alone — no rewriting needed unless a team code or section id
actually changes. Point `PLAYWRIGHT_CHROMIUM_PATH` at a local browser binary
to skip Playwright's managed download.

### Deploy

1. Push this repo to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Done — Vercel auto-detects Next.js. No environment variables, database, or
   other backend services are required.
