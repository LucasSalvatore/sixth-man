# Continue after Phase 0

Use this prompt for **one selected phase only**. Detailed requirements remain in [codex-phases.md](./codex-phases.md); this handoff does not mark Phase 0 approved or merged.

## Kickoff

```text
Repository: https://github.com/LucasSalvatore/sixth-man
Execute Phase <N> only, where N is the owner's selected phase from 1–6.

Read AGENTS.md, docs/prompts/codex-phases.md, this handoff, and the Phase 0
QA evidence before changing code. Check the current branch/PR state first.
Work from the branch containing the accepted prerequisite phases. Use a
codex/ branch and one PR per phase. Target claude/deep-bench-nextjs-scaffold-rak0q5
until the rework is merged; target main afterward. Do not base new work on
the old single-page main or include another unmerged phase's diff silently.

Before writing code, restate this phase's acceptance criteria and identify
unresolved owner decisions, absent data, and unverified facts. Ask about
explicit owner decisions instead of choosing. Resolve factual blockers from
primary sources and record URL, access date, confidence, and remaining gaps.
Do not treat old research notes or search snippets as verified current rules.

Build only the selected phase's supported scope. If necessary data, permission,
or a verifiable formula is missing, document the blocker and stop dependent
work. Do not add placeholder numbers, speculative odds, or a new feed silently.

Keep routes, navigation, and shared components under one owner. Give parallel
builders disjoint files. Serve one production build for read-only UI audits;
no agent may run build/dev/tests against that server's .next directory.

Before completion, run the data guard, npm run build, npm run lint, and the
full npm test suite without conflicting .next writers. New surfaces need
Playwright expectations read from their JSON. Inspect desktop and 375px
screenshots, keyboard/touch states, and no-JS source content. Preserve Phase 0
Lighthouse mobile performance/accessibility >=95 on /, /bench, /teams/BOS
and zero serious/critical axe violations; audit new surfaces too.

Report exact commands, results, failures, skipped checks, and evidence paths.
Open one reviewable phase PR against the correct base. Do not merge or start
the next phase as part of this run. Leave an updated blocker/decision list.
```

## Decisions and acceptance gates

| Phase | Resolve before dependent implementation | Acceptance beyond the shared checks |
| --- | --- | --- |
| **1 — Standings** | Owner chooses a permitted feed or manual snapshot process and freshness threshold **N**. Recheck source terms, access, and pricing; prior notes are not current authorization. | Commit a dated, sourced snapshot; builds read it without fetching. Guard exact league membership, integer records, wins/losses identity, game limits, valid nonfuture dates and agreed freshness. Implement cited standings formulas once with tests; show conference/division views, bench context, source/date, and explicit alphabetical tie handling. |
| **2 — Lottery** | Read official release and rules PDF directly. Resolve draw mechanics, boundary ties, restrictions, and floor enforcement. Require an official per-pick table that the calculation reproduces. Owner reviews any curated pick ownership. | Do not encode old odds or ship unchecked computed odds. Test exact published results before the board ships. State ownership limits and midseason assumptions. Any simulation is clearly labelled and never persisted/shared as a real result. |
| **3 — Retrospective draft class** | Owner supplies pipeline output, selects a cited expected-value curve or pipeline-fitted regression, and chooses the minutes threshold. | Guard the new file; display pipeline fields rather than browser-estimated pick value. Below-threshold players remain visible but unranked. |
| **4 — Incoming draft class** | Owner supplies an attributed, dated editorial board or approves named public boards and their use. | Guard/display the provided rankings and tiers, with attribution and links. Skip if no board is supplied; no invented scouting or mock-draft narrative. |
| **5 — Trades** | Phase 1 must have operated cleanly for the period required in the phase brief. Owner supplies and reviews sourced trades plus before/after pipeline snapshots. | Latest after-state matches live main data under the guard. Render shareable trade cards/social images from snapshots; do not calculate impact by adding player values in the page. |
| **6 — Freshness and polish** | Owner decides auto-merge policy, whether the points-only game is still wanted, and supplies the Substack URL. Refresh scripts and source permissions must already exist. | Scheduled refresh opens guarded PRs rather than pushing to main. Team transitions respect reduced motion. Implement only the optional features explicitly selected and supported. |

For Phase 2's official-source pointers and the full file schemas/routes for all phases, use [codex-phases.md](./codex-phases.md). None of its later-phase research claims was independently verified during Phase 0.

## Preserve these decisions

- Keep the **deep-bench** name and the `/bench` selector. Desktop scatter navigation, touch-pinned details, and keyboard/rail selection remain covered together.
- Preserve the five-step type scale, mobile comparison cards, visible keyboard focus, and source-backed social cards.
- `meta.asOf = "Early 2027"` is an **owner-supplied editorial label**, not a verified source date. Always retain its qualification. The source still describes a late-July/early-August 2026 roster snapshot. Never use that label to satisfy a new feed's timestamp/freshness guard.
- Existing `r` and `r2` retain the source's recorded precision. Do not regenerate model values in components.
- Exact source dates, reproducible pipeline inputs, and existing data-reuse permission remain unverified; see [Phase 0 research](../qa/phase-0-research.md). A later data refresh must resolve its own provenance rather than inherit assumed freshness.
- No renaming, logos, player photos, wagering, paid/on-chain product features, or fabricated numbers.
