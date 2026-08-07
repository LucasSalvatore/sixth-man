import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

type LineupData = { gainWins: number };

type DeepBenchData = {
  teams: { team: string }[];
  lineups: Record<string, LineupData>;
  minutes: Record<string, unknown[]>;
};

// Read straight from the same JSON the app renders from, so these tests keep
// working unchanged against a future data refresh — no team list or expected
// value is hand-copied here.
export const DATA: DeepBenchData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../data/deep-bench-data-v2.json"), "utf8"),
);

export const TEAM_CODES: string[] = DATA.teams.map((t) => t.team);

export async function gotoHome(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
}

export async function clickScatterPoint(page: Page, code: string) {
  await page.locator('svg[role="application"]').scrollIntoViewIfNeeded();
  await page.locator(`svg[role="application"] g[data-team="${code}"]`).first().click({ force: true });
}

export async function clickRailTeam(page: Page, code: string) {
  await page.locator("#lineup-optimizer").scrollIntoViewIfNeeded();
  await page.getByRole("radio", { name: code, exact: true }).click();
}

export function scatterPoint(page: Page, code: string) {
  return page.locator(`svg[role="application"] g[data-team="${code}"]`).first();
}

/** Reads the lineup optimizer's "Wins gained" readout as rendered. */
export async function readOptimizerState(page: Page): Promise<{ gain: string | null; optimal: boolean }> {
  return page.evaluate(() => {
    const section = document.querySelector("#lineup-optimizer")?.closest("section");
    if (!section) return { gain: null, optimal: false };
    const blocks = [...section.querySelectorAll("div")];
    const gainBlock = blocks.find(
      (d) => d.textContent?.startsWith("Wins gained") && (d.textContent?.length ?? 0) < 80,
    );
    if (!gainBlock) return { gain: null, optimal: false };
    const text = gainBlock.textContent ?? "";
    const optimal = text.includes("Already optimal");
    const match = text.match(/[+−]\d+\.\d{2}/);
    return { gain: match ? match[0] : null, optimal };
  });
}

/** True if the rendered "Wins gained" readout matches the source JSON for `code`. */
export function optimizerMatchesSource(
  state: { gain: string | null; optimal: boolean },
  code: string,
): boolean {
  const lineup = DATA.lineups[code];
  if (!lineup) return false;
  if (lineup.gainWins === 0) return state.optimal;
  if (state.gain === null) return false;
  const parsed = parseFloat(state.gain.replace("−", "-"));
  return Math.abs(parsed - lineup.gainWins) < 0.006;
}

export async function tableRowCount(page: Page): Promise<number> {
  return page.locator("tbody tr[data-flip-key]").count();
}

export async function checkedRailTeam(page: Page): Promise<string | null> {
  const el = page.locator('[role="radio"][aria-checked="true"]');
  if ((await el.count()) === 0) return null;
  return (await el.first().textContent())?.trim() ?? null;
}
