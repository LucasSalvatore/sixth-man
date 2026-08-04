# sixth-man

What each NBA bench is worth in wins, what those wins cost, and where the
lineups and minutes should go

## deep-bench

A static Next.js app under the Lucan Labs brand. No backend, no database, no
API routes — every figure is read at build time from
[`data/deep-bench-data.json`](./data/deep-bench-data.json).

### What's on the page

- **Scatter** — bench payroll against bench wins above average, one point per
  team in that team's own colour, with quadrant lines at the league-average
  payroll and at zero.
- **Table** — all thirty benches, sortable, with an inline diverging bar per
  row and the amber data flag for the twelve affected teams.
- **Lineup optimizer** — the current five against the model's optimal five for
  the selected team, with the wins gained between them.
- **Minutes plan** — current minutes against the model's target for every
  graded player on the selected team.
- **How this was built** — the source's own definitions, quoted, plus the five
  limitations in plain language.

### Data integrity

No BPM, salary, win, gain, or minute value is generated, modified, estimated,
or recomputed anywhere in this app. Values are read from the JSON and rendered
as-is; only presentation changes (dollars shown in millions, a true minus
glyph, fixed decimal places). Two consequences are deliberate:

- The `delta` column renders the source's `delta` field and never `opt − cur` —
  twelve of the 276 minute rows disagree with the computed figure.
- The six teams with no lineup in the source get an empty state that says so.
  No lineup is constructed for them, and four-player lineups are shown with
  four players.

The one derived figure on the page is the scatter's league-average payroll
reference line, which is labelled as an average where it appears.

### The data guard

`scripts/check-data.mjs` validates the data file and **fails the build** if any
invariant breaks. It is the permanent defense against a bad data swap — the
September refresh included. A refresh that quietly breaks the league identity,
drops a field, or loses a disclosure stops here instead of shipping wrong
numbers to the page.

```
npm run check-data              # check the canonical data file
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

### Deploy

1. Push this repo to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Done — Vercel auto-detects Next.js. No environment variables, database, or
   other backend services are required.
