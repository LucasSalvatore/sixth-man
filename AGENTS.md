# Working in this repo

deep-bench is a static Next.js 15 (App Router) / React 19 / Tailwind 3 site
about NBA bench economics, under the Lucan Labs brand. No backend, no database,
no API routes: every figure is read at build time from JSON files in `data/`.

Read this before changing anything. These rules are why the site can be trusted,
and every one of them has been broken by accident at least once.

## Commands

```
npm ci
npm run dev           # http://localhost:3000
npm run build         # runs the data guard first, then next build
npm run check-data    # the guard on its own
npm run lint
npm test              # Playwright suite; starts its own dev server on :3900
```

`npm test` and `npm run build` both write to `.next/`. Never run them while a
`next dev` or `next start` you care about is serving from the same directory —
the build output gets corrupted and pages 500 with "Cannot find module".

## Rule 1 — no number is ever invented

Every number a visitor sees is one of exactly two things:

1. **A direct field read** from a JSON file in `data/`.
2. **The output of a fixed, public, cited formula** applied to those fields
   (the NBA lottery combination table is the only one so far), implemented once
   in `lib/` with a test that reproduces published values.

Nothing else. Components do not average, sum, estimate, extrapolate, round to a
nicer value, or fill a gap with a plausible figure. Sorting and ranking by a
field is fine; arithmetic on fields is not, unless it is formula (2).

- If the data for something does not exist, **do not build the surface with
  placeholder numbers**. Leave it out, or show an explicit "the source has no
  data for this" state. Sample, mock, lorem or "illustrative" figures never ship.
- Formatting changes presentation only: `lib/format.ts` owns it (dollars in
  millions, explicit `+`/`−` signs, U+2212 minus, fixed decimals). Use those
  helpers; do not format inline.
- Anything modelled rather than measured is labelled as such next to the number
  (see `components/flags.tsx`: steel `⟲` = a real prior-season stat reused as a
  prior; amber `◆` = a modelled placeholder that is not a real stat).
- Every data file that changes over time carries its own `asOf` and `source`,
  and the page shows both. A visitor must be able to tell how old a number is.

## Rule 2 — every data file has a guard

`scripts/check-data.mjs` runs before every build and fails it if a data file
breaks an invariant (30 teams, projected wins sum to 1230, bench wins above
average sum to 0, …). A new data file gets new invariants in the same script
before any page reads it. Prefer league identities that a lagging or
half-updated source would violate (total wins must equal total losses) over
shape checks alone. A check must refuse to pass vacuously when a field is
missing.

Automated feeds write to `data/` through a script in `scripts/`; the build never
fetches from the network. Anything a source can get wrong in a way the guard
cannot catch (trades, pick ownership, prospect rankings) is curated by hand and
reviewed before it is committed.

## Rule 3 — identity and tone

- No team logos, no player photos, no league marks. A team's colour
  (`lib/teamColors.ts`, exposed as the `--team` CSS variable) is the only
  identity device. Three near-achromatic teams (BKN, SAS, MIL) change *form*
  (hollow marks, doubled keylines) rather than colour — see `isAchromatic`.
- No wagering, odds-for-money, sportsbook links or fantasy-for-cash framing.
  Any prediction or ranking feature is free and points-only.
- Copy states what the numbers say and what they cannot see. No hype, no
  exclamation marks, no claims the data does not support.

## Rule 4 — craft floors

- Every numeral is set in the mono face via `<Num>` (`components/ui.tsx`), so
  columns align by construction.
- Colour tokens live in `app/globals.css` (`--bg-*`, `--text-*`, `--rule-*`,
  `--gold`, `--pos`, `--neg`). `--text-lo` is the contrast floor for text
  (≥ 4.5:1 on every surface). Polarity never rides on colour alone — signs are
  explicit.
- Works at 375px with no horizontal page scroll; tap targets ≥ 32px.
- Everything interactive is keyboard-operable with a visible focus style
  (`:focus-visible` is global — do not remove outlines).
- `prefers-reduced-motion` collapses every animation to its end state
  (`useReducedMotion` in `lib/motion.ts`). Content is never gated behind an
  animation: it must be present with JS off and before hydration.
- Never put `<Reveal>` (or any transform) on an ancestor of a `position: sticky`
  element.
- A render error in one section must not blank the page: wrap independent
  data-driven sections in `<ErrorBoundary>`.

## Rule 5 — done means verified

A change is done when `npm run build`, `npm run lint` and `npm test` all pass,
and any new surface has Playwright coverage in `tests/` that reads its expected
values from the same JSON the page renders from (see `tests/support/fixtures.ts`)
— never from numbers typed into the test.

Report what you ran and what failed. If a step was skipped, say so.
