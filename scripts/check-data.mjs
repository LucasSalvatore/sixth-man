#!/usr/bin/env node
/**
 * Build-time data guard.
 *
 * Runs automatically before `next build` (see the "prebuild" script in
 * package.json) and fails the build with a readable message if the data file
 * breaks any invariant. This is the permanent defense against a bad data swap —
 * including the September refresh. A future refresh that quietly breaks the
 * league identity, drops a field, or loses a flag stops here rather than
 * shipping wrong numbers to the page.
 *
 * Usage:
 *   node scripts/check-data.mjs                 # checks DATA_FILE
 *   node scripts/check-data.mjs <path>          # checks an explicit file
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/** The single place the canonical data file is named. */
export const DATA_FILE = "data/deep-bench-data-v2.json";

const TARGET = resolve(process.cwd(), process.argv[2] ?? DATA_FILE);

const results = [];
let failed = false;

function check(name, ok, detail) {
  results.push({ name, ok, detail });
  if (!ok) failed = true;
}

function money(n) {
  const sign = n < 0 ? "−" : "+";
  return `${sign}$${(Math.abs(n) / 1_000_000).toFixed(2)}M`;
}

if (!existsSync(TARGET)) {
  console.error(`\n  Data guard: file not found\n\n    ${TARGET}\n`);
  console.error(`  The site is wired to "${DATA_FILE}". Add the corrected data file`);
  console.error(`  at that path, or pass an explicit path to this script.\n`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(readFileSync(TARGET, "utf8"));
} catch (error) {
  console.error(`\n  Data guard: ${TARGET} is not valid JSON\n\n    ${error.message}\n`);
  process.exit(1);
}

const teams = Array.isArray(data.teams) ? data.teams : [];
const lineups = data.lineups && typeof data.lineups === "object" ? data.lineups : {};

// --- Shape ---------------------------------------------------------------
check("teams is a 30-entry array", teams.length === 30, `found ${teams.length}`);

// --- League identity: the projections must describe a real season --------
const sumProjWins = teams.reduce((sum, t) => sum + (t.projWins ?? 0), 0);
check(
  "sum of projWins is 1230 (±0.5)",
  Math.abs(sumProjWins - 1230) <= 0.5,
  `sum = ${sumProjWins.toFixed(2)} (off by ${(sumProjWins - 1230).toFixed(2)})`,
);

// --- Bench wins are measured against average, so they must cancel --------
const sumBenchWins = teams.reduce((sum, t) => sum + (t.benchWinsAboveAvg ?? 0), 0);
check(
  "sum of benchWinsAboveAvg is 0 (±0.05)",
  Math.abs(sumBenchWins) <= 0.05,
  `sum = ${sumBenchWins.toFixed(4)}`,
);

// --- Surplus is measured against the league's own pricing, so it cancels --
const missingSurplus = teams.filter(
  (t) => t.benchSurplusValue === undefined || t.benchSurplusValue === null,
);
check(
  "every team has a non-null benchSurplusValue",
  missingSurplus.length === 0,
  missingSurplus.length
    ? `${missingSurplus.length} missing: ${missingSurplus.map((t) => t.team ?? "?").join(", ")}`
    : "all 30 present",
);

// Only meaningful once every value is present — otherwise absent fields would
// coerce to zero and the sum would pass vacuously on a file missing the field.
const sumSurplus = teams.reduce((sum, t) => sum + (t.benchSurplusValue ?? 0), 0);
check(
  "sum of benchSurplusValue is $0 (±$0.5M)",
  missingSurplus.length === 0 && Math.abs(sumSurplus) <= 500_000,
  missingSurplus.length
    ? `cannot evaluate — ${missingSurplus.length} team(s) have no benchSurplusValue`
    : `sum = ${money(sumSurplus)}`,
);

// --- Flags: every excluded/imputed player must still be disclosed --------
const flagCount = teams.reduce(
  (sum, t) => sum + (Array.isArray(t.dataFlags) ? t.dataFlags.length : 0),
  0,
);
check("total dataFlags entries across teams is 22", flagCount === 22, `found ${flagCount}`);

const KNOWN_REASONS = new Set(["returning_from_injury", "rookie_no_history"]);
const badReasons = [];
for (const team of teams) {
  for (const flag of team.dataFlags ?? []) {
    if (!KNOWN_REASONS.has(flag?.reason)) {
      badReasons.push(`${team.team}/${flag?.player ?? "?"}: ${String(flag?.reason)}`);
    }
  }
}
check(
  "every dataFlags reason is a known value",
  badReasons.length === 0,
  badReasons.length ? badReasons.join("; ") : "all recognised",
);

// --- Lineups -------------------------------------------------------------
const negativeGain = Object.entries(lineups).filter(([, v]) => (v?.gainWins ?? 0) < 0);
check(
  "no lineup has a negative gainWins",
  negativeGain.length === 0,
  negativeGain.length
    ? negativeGain.map(([code, v]) => `${code}: ${v.gainWins}`).join(", ")
    : `checked ${Object.keys(lineups).length} lineups`,
);

const byCode = new Map(teams.map((t) => [t.team, t]));
const bpmMismatch = [];
for (const [code, lineup] of Object.entries(lineups)) {
  const team = byCode.get(code);
  if (!team) {
    bpmMismatch.push(`${code}: no matching team entry`);
    continue;
  }
  if (lineup?.curLineupBPM === undefined || lineup?.curLineupBPM === null) {
    bpmMismatch.push(`${code}: curLineupBPM missing`);
    continue;
  }
  const delta = Math.abs(lineup.curLineupBPM - team.starterBPM);
  if (delta > 0.01) {
    bpmMismatch.push(
      `${code}: curLineupBPM ${lineup.curLineupBPM} vs starterBPM ${team.starterBPM} (off by ${delta.toFixed(3)})`,
    );
  }
}
check(
  "curLineupBPM matches the team's starterBPM (±0.01)",
  bpmMismatch.length === 0,
  bpmMismatch.length ? bpmMismatch.join("; ") : `checked ${Object.keys(lineups).length} lineups`,
);

// --- Report --------------------------------------------------------------
const label = TARGET.replace(`${process.cwd()}/`, "");
console.log(`\n  Data guard — ${label}\n`);
for (const { name, ok, detail } of results) {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${name}`);
  if (!ok || process.env.DATA_GUARD_VERBOSE) console.log(`        ${detail}`);
}

if (failed) {
  const n = results.filter((r) => !r.ok).length;
  console.error(
    `\n  Build stopped: ${n} data invariant${n === 1 ? "" : "s"} failed.\n` +
      `  The data file is wrong, not the site. Fix the data before building.\n`,
  );
  process.exit(1);
}

console.log(`\n  All ${results.length} invariants hold.\n`);
