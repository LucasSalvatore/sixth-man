# Agent build brief — how this version was produced

A reusable prompt for running the same audit → build → verify loop with
subagents (Claude Code or similar). Swap the bracketed parts.

## Orchestrator prompt

```
You are the lead on a rework of [site] in [repo]. Read AGENTS.md first; its
rules bind you and every agent you start.

1. AUDIT (three agents in parallel, read-only, each reports only to you):
   a. Design/UX — screenshot every section at 1440 and 390 wide plus
      interaction states; report what is weak (ranked, tied to a screenshot or
      component), what must survive, and a concrete route map and 5–8 named
      visual moves. No mood-board adjectives.
   b. Diagnostics — Lighthouse mobile + desktop, axe-core at both widths, and a
      static read for real defects (file:line, failure scenario, CONFIRMED or
      PLAUSIBLE). No generic advice.
   c. Research — every external fact the build depends on (rules, formats,
      data feeds and their terms), each with a source URL, date and a
      HIGH/MEDIUM/LOW confidence label, ending in an "Unverified" list.
   Serve one production build for (a) and (b); forbid them from running build,
   dev or test commands against the same .next directory.

2. DECIDE. Build only what the data and the verified facts support. Anything
   resting on a LOW or unverified fact, or on data that does not exist, is
   written up as a later phase with its blockers — not built with stand-ins.

3. BUILD the shared shell yourself (routes, nav, shared components). Hand out
   surfaces to builder agents only where their files do not overlap.

4. VERIFY. Guard, build, lint, full test suite. New surfaces get tests that
   read expected values from the data files. Screenshot desktop and 375px and
   look at them. Report what ran, what failed, what was skipped.

5. HAND OFF the remaining phases as a prompt another agent can execute one
   phase at a time, with acceptance criteria and open decisions listed.
```

## What that produced here

- **Audit findings acted on:** no wayfinding → persistent nav (top bar, bottom
  tabs on mobile) and five routes; nothing linkable → 30 static team cards;
  flat hierarchy and team colour used at 2px → one full team-colour band with a
  giant numeral per screen; nothing that changes → a bench of the day; hero
  prose with literal figures → field reads.
- **Research findings that stopped work:** the 2027 lottery is a new 16-team
  format whose draw mechanics could not be confirmed from an official source,
  and no free standings feed is usable under its terms. Standings and the
  lottery board were therefore not built; see `codex-phases.md` phases 1–2.
- **Not done:** the diagnostics agent did not complete (usage limit), so there
  is no Lighthouse or axe baseline; it is the acceptance bar for Phase 0.
