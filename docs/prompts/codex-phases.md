# Codex build prompt — deep-bench rework, phases 0–6

Paste the block under "Kickoff" into Codex, one phase at a time. Everything
below it is the reference Codex should read from this file.

## Kickoff (paste this)

```
Read AGENTS.md and docs/prompts/codex-phases.md in full before touching code.
Execute Phase <N> only. Do not start the next phase.

Before writing code: restate the phase's acceptance criteria and list any
"Decision needed" items that are still open — stop and ask me about those
instead of choosing.

Done means: npm run build, npm run lint and npm test all pass; new surfaces
have Playwright coverage that reads expected values from the JSON; you report
exactly what you ran, what failed, and what you skipped. Open one PR per phase
against main. Never invent, estimate or placeholder a number — if data is
missing, stop and say so.
```

## Where the site is now

A static Next.js 15 app. Routes: `/` (front door: headline, a "bench of the
day" team band that rotates by calendar day, three ranked boards, all-team
grid), `/bench` (scatter, sortable table, team selector driving lineup
optimizer + minutes plan), `/teams` (index), `/teams/[code]` (30 static team
cards), `/method`. One data file, `data/deep-bench-data-v2.json`, guarded by
`scripts/check-data.mjs`. League structure is in `lib/league.ts`. 60 Playwright
tests in `tests/`.

Naming is undecided by the owner. The wordmark stays "deep-bench" until told
otherwise — do not rename anything.

## Phase 0 — Retool what exists (no new data)

Defects found in an independent audit of the current build. Fix all of them.

1. **Scatter is unreadable.** 25 of 30 points are unlabelled and several team
   colours collide (CHI/HOU/TOR are identical). From 640px up, render each
   point as a three-letter code chip in the team colour. Draw the fair-price
   line through the teams' `fairMarketBenchPayroll` values (a direct read) so
   surplus is visibly the horizontal distance from the line; draw
   `meta.leagueAvgBenchPayroll` as a reference rule. Clicking a point on
   desktop should navigate to `/teams/[code]`; on touch, the first tap pins the
   detail card, which carries the link.
2. **Focus box.** Clicking a scatter point draws a white browser focus
   rectangle over its label. Keep keyboard focus visible; remove the artefact
   for pointer clicks.
3. **Sticky header.** `TeamsTable`'s header is meant to stick and scrolls away
   (its scroll container is the sticky boundary). Make it stick under the
   56px site nav.
4. **Mobile table.** At 375px the default sort column is off-screen and the
   copy says "hover". Give mobile a card-per-team list (code, surplus, bench
   WAA, payroll) with the same sort control; fix the copy; make flag buttons
   ≥ 32px.
5. **Lineup optimizer.** When `gainWins` is 0, show one list, not two
   identical cards. When there is a swap, show one merged list with Out/In
   rows. On mobile, promoted players' names must not truncate.
6. **Minutes plan** has an unexplained bar, bracket and dashed line. Add a
   legend.
7. **Hard-coded figures in prose.** `components/Methodology.tsx` (and any
   remaining literal in `components/Hero.tsx`, including the "six percent" /
   r = 0.25 claim and the "2025-26" kicker) must read from the JSON. Add `r`,
   `r2` and a season label as fields in `meta` rather than parsing them out of
   the formula string; add them to the guard.
8. **Type scale.** There are ~21 font sizes. Collapse to five steps
   (12 / 15 / 20 / 34 / display) with a 12px floor; the "$" and "m" in
   `<Money>` currently render at 8px.
9. **Front door.** Add a compact, non-interactive version of the scatter that
   links to `/bench`. Add an `asOf` field to the data file's `meta` and show it
   in the masthead and on every team card.
10. **Per-route social cards.** `app/opengraph-image.tsx` is site-wide; add one
    for `/teams/[code]` in that team's colour with its surplus value.
11. `/bench` still has the in-page team selector *and* team cards exist. Decide
    with the owner whether the selector stays (Decision needed).

Acceptance: every item above has a test or a before/after screenshot in the PR;
Lighthouse mobile performance and accessibility ≥ 95 on `/`, `/bench`,
`/teams/BOS`; axe reports no serious or critical violations.

## Phase 1 — Standings

**Decision needed first: the feed.** Researched 16 Nov 2026; none is clean:

| Source | Key | Problem |
| --- | --- | --- |
| ESPN `site.api.espn.com/apis/v2/sports/basketball/nba/standings` | none | Undocumented; Disney terms bar automated access; frequent 403s from server IPs |
| balldontlie | yes | Standings are in the $39.99/month tier only |
| sportsdata.io | yes | Free trial data is deliberately scrambled; not displayable |
| `stats.nba.com` leaguestandingsv3 | none | Times out from cloud/CI IPs; terms restrict regularly-updated databases |
| Basketball-Reference | none | HTML only; data-use page forbids building tools on scraped data |

Options to put to the owner: (a) pay for balldontlie, (b) a hand-run local
script against one source with the snapshot committed, (c) hand-entered
snapshot on the existing refresh cadence. Do not pick silently, and do not
build against a source whose terms forbid it without the owner saying so.

Build, once decided:
- `scripts/refresh-standings.mjs` normalises the source into
  `data/standings.json`: `{ asOf, source, season, teams: [{ team, wins, losses,
  home, away, lastTen, streak }] }`. The build never fetches; it reads the
  committed file.
- Guard additions: exactly the 30 league codes; integers; total wins = total
  losses; no team above 82 games; `asOf` parses and is not in the future; fail
  if `asOf` is more than N days old during the season (owner sets N).
- `/standings`: East and West tables plus a division view. Rank, win
  percentage and games-behind are the standard public formulas — implement once
  in `lib/standings.ts` with unit tests. Each row links to the team card and
  carries bench columns (bench WAA, surplus) and the model's projected wins
  beside the record — the bench-inflected view is the reason to use this page
  instead of a live scores site. Show `asOf` and `source` at the top.
- Front door: standings snapshot beside the bench of the day. Team card: record
  and seed.
- Tie-breaking beyond win percentage: sort ties alphabetically and say so on
  the page; do not implement the NBA's full tiebreak procedure unless asked.

## Phase 2 — Lottery board (2027 draft)

**The format changed. Do not encode the old 14-team / 1000-combination table.**
What research found (search-snippet confidence; official text was not read):

- Board of Governors approved the "3-2-1 Lottery" on 28 May 2026 for the 2027,
  2028 and 2029 drafts. 16 teams, 37 balls, all 16 picks drawn.
- Three worst records: 2 balls each, cannot fall below pick 12.
- Other seven teams missing playoffs and play-in: 3 balls each.
- 9th and 10th seeds in each conference: 2 balls each.
- Losers of the two 7-vs-8 play-in games: 1 ball each.
- A team's own pick cannot be No. 1 in consecutive drafts or top-5 in three
  straight (streaks count from 2025). Reported 2027 effects: Washington's pick
  cannot be No. 1; Utah's pick (owed to Memphis) cannot be top-5.

**Blockers — resolve before building:**
1. Read the official release and rules PDF directly
   (`pr.nba.com/nba-board-of-governors-approves-new-draft-lottery-system-to-address-tanking/`,
   and the "NBA-3-2-1-Draft-Lottery.pdf" on `ak-static.cms.nba.com`). Confirm
   ball counts, the draw mechanics (how the pick-12 floor is enforced), tie
   handling at the group boundaries, and the restriction rules. Quote the
   passages in the PR.
2. Only then implement `lib/lottery.ts` as an exact computation from ball
   counts, with a test that reproduces the league's published per-pick table.
   If the league has not published one, or yours does not match it, stop and
   report — do not ship computed odds you cannot check against an official
   figure.
3. Pick ownership (traded picks, protections) has no feed. Curate
   `data/pick-ownership.json` by hand with a source URL per entry, owner
   reviews before merge. Until it exists the board shows own-pick order only
   and says so.

Build: `/lottery` — pick, team, record, lottery group, No. 1 odds, the seed-by-
pick matrix, bench WAA and surplus per row; picks 17–30 by reverse record. A
"run the lottery" simulation is allowed (it is the fixed formula with a random
draw) and must be labelled a simulation, never persisted, never shareable as a
result. Mid-season, which teams fall in each group depends on projecting the
play-in from current seeds — state the assumption on the page.

## Phase 3 — Draft class, retrospective

"Who is outplaying their slot" for the 2026 class, in this site's own
framework. Needs a new data file produced by the existing Basketball-Reference
pipeline (owner runs it): pick number, team, minutes, BPM, plus whatever the
bench framework needs. Decision needed: what "expected value for pick N" is —
it must be a cited public curve or a regression fitted in the pipeline and
shipped as fields, never computed in the browser. Rookies below a minutes
threshold (owner sets it) are listed as "not enough minutes", not ranked.

## Phase 4 — Draft class, incoming

A ranked, tiered board for the 2027 class. These are editorial rankings with no
engine behind them — say whose they are. Either the owner's own board
(`data/prospects.json`, hand-maintained, dated) or a consensus of named public
boards with links. No mock-draft prose, no wagering framing. Lowest priority of
the data work; skip if the owner has not supplied a board.

## Phase 5 — Trades tracker

Last, and only after Phase 1 has run cleanly for a few weeks. "This trade moved
Team X's bench by N wins" requires re-running the model pipeline before and
after the trade — it is two pipeline snapshots, not arithmetic on the page.
Shape: `data/trades.json`, one entry per trade, hand-entered with source URL,
carrying before/after `benchWinsAboveAvg` and `benchSurplusValue` for each team
as produced by the pipeline. Every entry is reviewed by the owner before it
merges. Guard: the after-state of the latest trade must equal the live values
in the main data file. `/trades` lists them newest first; each is a shareable
card with its own social image.

## Phase 6 — Freshness and polish

- A scheduled GitHub Action that runs the refresh script(s), runs the guard,
  and opens a PR (not a direct push to main) when data changed. Decision
  needed: whether the owner wants auto-merge when the guard passes.
- View Transitions between a team tile and its card band; hard cut under
  `prefers-reduced-motion`.
- Points-only prediction game, if the owner still wants it: free, no money,
  no odds.
- Link the Substack once the owner supplies the URL.

## Out of scope for every phase

Renaming or rebranding; team logos or player photos; anything paid, on-chain or
wagering-adjacent; any number that is not a field read or a cited fixed formula.
