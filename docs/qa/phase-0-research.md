# Phase 0 research and provenance

Audited **15 November 2026 (America/New_York)**. Scope: existing data and Phase 0 only. Read `AGENTS.md` and `docs/prompts/codex-phases.md` in full. No standings, lottery, draft, or trade research was performed.

## Metadata provenance

The original dataset explicitly recorded `r=0.25` and `r2=0.06` in its formula description. Phase 0 promotes those recorded values to fields, preserving their precision. It does not derive `r2` by squaring a rounded `r` or re-fit the regression. The source distinguishes 2025–26 box scores, 2024–25 injury priors, and 2026–27 payroll/rosters. The season label retains that distinction. **HIGH confidence as source declarations**, not independent validation of the model. [Audited dataset](https://github.com/LucasSalvatore/sixth-man/blob/559a21c/data/deep-bench-data-v2.json#L5).

The exact source date was absent from both the current file and historical uploads examined (`c763bd1`, `edeccdf`). Git upload dates do not establish when observations were collected. The existing disclosure describes a late-July/early-August 2026 roster snapshot.

The owner explicitly requested the label **“Early 2027.”** `meta.asOf` records that editorial label; it is **not verified freshness and does not indicate a data refresh**. `meta.asOfNote` displays the owner-supplied nature, the existing 2026 source snapshot, and the unverified exact source date beside it. It is not represented as an ISO timestamp. **HIGH confidence in the owner's instruction; LOW confidence as an observation date.** The original roster disclosure remains intact.

## Dependencies checked

All web sources below were checked on 15 November 2026. Confidence distinguishes directly read evidence from indexed excerpts or unreproduced source claims.

| Dependency | Evidence and implication | Confidence |
| --- | --- | --- |
| Fair-price, average payroll, surplus, lineup and minutes values | Existing JSON supplies the displayed values, including `fairMarketBenchPayroll` and `leagueAvgBenchPayroll`. Draw geometry from fields; do not recompute model outcomes. [Dataset](https://github.com/LucasSalvatore/sixth-man/blob/559a21c/data/deep-bench-data-v2.json) | HIGH for field availability; model reproduction unverified |
| Methodology limitations | Formula notes and all seven disclosures exist in the JSON. Quote source text instead of maintaining independent numerical prose. [Dataset metadata](https://github.com/LucasSalvatore/sixth-man/blob/559a21c/data/deep-bench-data-v2.json#L5) | HIGH as source declarations |
| Team grouping | Existing division membership matches the [NBA team directory](https://www.nba.com/teams). | HIGH |
| BPM meaning | The publisher describes BPM as a box-score estimate relative to an average player. [Sports Reference explanation](https://info.sports-reference.com/migration/knowledge/basketball-advanced-stats) | HIGH |
| Source data-use terms | Indexed official text requires permission for websites/tools based on scraped data. Direct fetch returned 403; existing reuse authorization could not be verified. Phase 0 adds no feed or scraping. [Sports Reference data-use policy](https://www.sports-reference.com/data_use.html) | MEDIUM for indexed policy text; authorization unverified |
| Keyboard focus | Keyboard-operated controls require visible focus; `:focus-visible` is a documented technique. [W3C focus guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) | HIGH |
| Contrast | Ordinary text requires 4.5:1 contrast. Borderline ratios cannot be rounded upward; evaluate actual foreground/background pairs. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | HIGH |
| Team social cards | Next.js 15 supports route-colocated `opengraph-image.tsx` and dynamic route parameters. [Versioned framework documentation](https://nextjs.org/docs/15/app/api-reference/file-conventions/metadata/opengraph-image) | HIGH |

## Unverified

- Exact source observation date. “Early 2027” remains an owner-supplied label, not evidence of freshness.
- Underlying regression precision beyond recorded decimals, pipeline, extraction URLs, and independent model reproduction.
- Independent historical validation of roster, salary, and imputation claims.
- Existing permission for Sports Reference data reuse.
- Official provenance of adapted team hex colours; retain the existing identity palette and verify rendered contrast locally.

These findings do not authorize new model calculations, invented data, or later-phase surfaces.
