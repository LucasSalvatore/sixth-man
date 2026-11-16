# Phase 0 change and verification record

Phase 0 implements the existing-data rework. **Final acceptance is not yet established:** the mobile Lighthouse performance gate has not passed locally. Use the PR's **Phase 0 verification** check and its uploaded artifacts for the final revision's complete results; do not treat this change record as a passing CI result.

## Changes and evidence

All existing model values, teams, players, lineups, minutes, and disclosures are unchanged. The dataset diff adds only seven metadata fields: `r`, `r2`, `seasonLabel`, `asOf`, `asOfNote`, `source`, and `minutesCeiling`. Numeric metadata promotes values already declared in the source. **“Early 2027” is the owner's editorial snapshot label, not a verified observation date or a data refresh.** Its visible qualification retains the source's late-July/early-August 2026 roster snapshot and unknown exact date.

| Brief item | Implementation and coverage | Selected committed evidence |
| --- | --- | --- |
| 1. Readable scatter | Labelled chips at 640px+, source-field fair-price/average rules, desktop navigation, touch-pinned details. [Scatter tests](../../tests/scatter-phase0.spec.ts). | [Before desktop](./phase-0/before/1440-bench-scatter.png), [after desktop](./phase-0/after/1440-bench-scatter.png), [after 640px](./phase-0/after/640-bench-scatter.png), [after mobile](./phase-0/after/375-bench-scatter.png) |
| 2. Pointer/keyboard focus | Pointer focus artefact removed; visible keyboard focus retained. Physical pointer and keyboard assertions in [scatter tests](../../tests/scatter-phase0.spec.ts). | [Before selected point](./phase-0/before/390-bench-scatter-pointer-selected.png) |
| 3. Sticky table header | Page-scrolling header sticks below the 56px nav; no horizontal overflow ancestor. [Table tests](../../tests/table-phase0.spec.ts). | [Before](./phase-0/before/1440-bench-table-sticky-scroll.png), [after](./phase-0/after/1440-bench-table-sticky-scroll.png) |
| 4. Mobile comparison | Team cards expose surplus, bench WAA and payroll, shared sorting, links, and 32px-minimum flag controls. Cards remain through intermediate widths. [Table tests](../../tests/table-phase0.spec.ts). | [Before](./phase-0/before/390-bench-section-0-all-thirty-benches.png), [after](./phase-0/after/375-mobile-team-cards.png) |
| 5. Optimizer | One roster for zero gain; merged shared/Out/In rows otherwise; full mobile names. [Panel tests](../../tests/panels-phase0.spec.ts). | [Before zero](./phase-0/before/390-bench-lineup-zero.png), [after zero](./phase-0/after/375-bench-lineup-zero.png), [before swap](./phase-0/before/390-bench-lineup-swap.png), [after swap](./phase-0/after/375-bench-lineup-swap.png) |
| 6. Minutes legend | Solid current bar, optimal bracket, and source-defined ceiling are explained. [Panel tests](../../tests/panels-phase0.spec.ts). | [Before](./phase-0/before/390-bench-minutes-swap.png), [after](./phase-0/after/375-bench-minutes-swap.png) |
| 7. Source-backed prose | Formulas/disclosures quote JSON; regression and season fields feed hero/metadata; guard rejects missing fields. [Metadata tests](../../tests/metadata-phase0.spec.ts), [guard tests](../../tests/guard-phase0.spec.ts). | Data-backed assertions cover each source disclosure and all team snapshots. |
| 8. Type scale | 12/15/20/34/display steps; Money symbols/units remain at least 12px. [Metadata tests](../../tests/metadata-phase0.spec.ts). | [Mobile comparison](./phase-0/after/375-mobile-team-cards.png), [team band](./phase-0/after/375-teams-BOS-team-band.png) |
| 9. Front door/date | Static overview is one `/bench` link; qualified snapshot metadata appears in mastheads and all team cards. [Metadata tests](../../tests/metadata-phase0.spec.ts). | [Homepage preview](./phase-0/after/1440-home-section-1-what-payroll-buys.png), [before team masthead](./phase-0/before/390-teams-BOS-masthead.png), [after](./phase-0/after/375-teams-BOS-masthead.png) |
| 10. Team social cards | Each team receives a source-backed colour image and route-specific OpenGraph/Twitter metadata. [Social tests](../../tests/social-phase0.spec.ts). | [Boston social card](./phase-0/after/BOS-social.png) |
| 11. Selector retained | Rail, scatter, panels, and navigation-back selection remain synchronized. [Selection tests](../../tests/selection-sync.spec.ts), [stale-value tests](../../tests/stale-value.spec.ts), [rendering tests](../../tests/rendering-integrity.spec.ts). | Existing selection paths retained; touch and keyboard selection covered. |

Mobile before captures are 390px; after captures are 375px unless the filename states otherwise. Source content is rendered before hydration and with JavaScript disabled: [no-JS scatter](./phase-0/after/375-nojs-scatter.png), [scatter tests](../../tests/scatter-phase0.spec.ts), and [panel tests](../../tests/panels-phase0.spec.ts).

Performance work reduces client work: static UI/panels render on the server, figures show source values without count-up intermediates, the homepage renders one daily team band, and automatic link prefetching is disabled. The chart reserves its CSS height before mounting measured interactive geometry. These changes do not substitute for meeting the measured gate.

## Recorded verification

Baseline results are committed in [baseline.json](./phase-0/baseline.json).

| Route | Baseline mobile performance | Baseline mobile accessibility | Baseline desktop performance | Baseline desktop accessibility |
| --- | ---: | ---: | ---: | ---: |
| `/` | 90 | 100 | 100 | 100 |
| `/bench` | 90 | 98 | 100 | 98 |
| `/teams/BOS` | 94 | 98 | 100 | 98 |

- Baseline axe found serious accessible-name mismatches at both 1440px and 390px, plus moderate landmark/heading issues. The local v2 rerun reported **zero violations in all six route/width checks** for `/`, `/bench`, and `/teams/BOS`.
- The initial complete Playwright run finished **158 passed, 2 failed**. A chip's rendered height was 31.9995px; its nominal target was increased to 34px. A long interaction loop exceeded the default 30-second timeout; long-loop coverage now has a 90-second timeout. These fixes require the final full rerun; the earlier run is not recorded as passing.
- **v3 `npm run build` (including the prebuild data guard) and `npm run lint` passed.**
- Subsequent local mobile performance runs, on a host under load, **failed the 95 gate**: v2 scored 81/78/76 for `/`, `/bench`, `/teams/BOS`; v3 `/` scored 84, then Chrome closed before the remaining routes completed. Host load is recorded context, not a waiver or proof of cause. The incomplete v3 diagnostic set cannot pass.
- Final full-suite and diagnostic results remain pending in the PR check/artifacts. No final Lighthouse pass is claimed. Later phases were not implemented or independently researched.

## Reproduce without `.next` conflicts

Install the lockfile dependencies and browser, then build before starting the server:

```sh
npm ci
npx playwright install chromium
npm run check-data
npm run lint
npm run build
npm start -- -H 127.0.0.1 -p 4100
```

Keep that production server running. In another terminal, run the suite and then the audit sequentially:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4100 npm test -- --workers=2
AUDIT_BASE_URL=http://127.0.0.1:4100 AUDIT_OUTPUT_DIR=artifacts/phase0 npm run audit:phase0
```

`PLAYWRIGHT_BASE_URL` disables Playwright's development-server startup. Optionally set `PLAYWRIGHT_CHROMIUM_PATH` to an installed Chrome/Chromium executable for both commands. Do not build, run a development server, or run another test/screenshot browser during the audit. Stop the production server before the next build.

The [audit script](../../scripts/audit-phase0.mjs) saves JSON/HTML Lighthouse reports and raw axe reports. It uses Lighthouse's default mobile profile and the standard desktop configuration, with no weakened throttling. It requires mobile performance **and** accessibility ≥95 on all three benchmark routes, no serious/critical axe violations, and a complete report set. It also runs axe on `/teams` and `/method` at both widths. A tool error or incomplete run fails the command.

The [GitHub workflow](../../.github/workflows/phase0-verification.yml) builds once, serves one production build, runs the entire suite, then audits it without concurrent `.next` writers. The PR check and `phase0-verification-*` artifacts hold the final revision's results, raw diagnostics, server log, and available test traces. Local temporary logs are not portable acceptance evidence; the selected screenshots above are committed for review.

Further context: [research and provenance](./phase-0-research.md), [one-phase-at-a-time handoff](../prompts/after-phase-0.md), and [full phase brief](../prompts/codex-phases.md).
