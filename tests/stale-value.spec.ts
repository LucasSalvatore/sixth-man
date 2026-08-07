import { expect, test } from "@playwright/test";
import {
  DATA,
  clickRailTeam,
  clickScatterPoint,
  gotoHome,
  optimizerMatchesSource,
  readOptimizerState,
} from "./support/fixtures";

// The lineup optimizer and minutes plan are keyed on `selected` and remount
// on every change. Rapid, interleaved selection via BOTH paths (rail and
// scatter) is the case REPORT.md's original stale-value test never covered —
// it only exercised the rail.

const VIEWPORTS = [
  { name: "desktop", size: { width: 1440, height: 1000 } },
  { name: "mobile-375", size: { width: 375, height: 812 } },
];

const INTERLEAVED_SEQUENCE: Array<["scatter" | "rail", string]> = [
  ["scatter", "PHX"],
  ["rail", "DET"],
  ["scatter", "GSW"],
  ["rail", "BKN"],
  ["scatter", "MEM"],
  ["rail", "CLE"],
  ["scatter", "POR"],
  ["rail", "MIA"],
  ["scatter", "BOS"],
  ["rail", "DAL"],
  ["scatter", "PHX"],
];

const ALTERNATING_WALK: Array<["scatter" | "rail", string]> = [
  ["rail", "ATL"],
  ["scatter", "CHI"],
  ["rail", "LAL"],
  ["scatter", "TOR"],
  ["rail", "SAC"],
  ["scatter", "NYK"],
  ["rail", "MIN"],
  ["scatter", "WAS"],
  ["rail", "GSW"],
  ["scatter", "DEN"],
];

async function clickVia(page: Parameters<typeof clickScatterPoint>[0], via: "scatter" | "rail", code: string) {
  if (via === "scatter") await clickScatterPoint(page, code);
  else await clickRailTeam(page, code);
}

for (const { name, size } of VIEWPORTS) {
  test(`${name}: rapid interleaved rail+scatter clicks settle on the final team, not a stale one`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await gotoHome(page);

    for (const [via, code] of INTERLEAVED_SEQUENCE) {
      await clickVia(page, via, code);
      await page.waitForTimeout(110);
    }

    const [, finalCode] = INTERLEAVED_SEQUENCE[INTERLEAVED_SEQUENCE.length - 1];
    await expect
      .poll(async () => optimizerMatchesSource(await readOptimizerState(page), finalCode), {
        timeout: 2000,
      })
      .toBe(true);
    expect(errors).toEqual([]);
  });

  test(`${name}: alternating-path walk keeps the optimizer in sync with the source at every step`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await gotoHome(page);

    for (const [via, code] of ALTERNATING_WALK) {
      await clickVia(page, via, code);
      await expect
        .poll(async () => optimizerMatchesSource(await readOptimizerState(page), code), { timeout: 2000 })
        .toBe(true);
    }
  });
}

test("sanity: the fixture data actually distinguishes gain and already-optimal teams", () => {
  const values = Object.values(DATA.lineups).map((l) => l.gainWins);
  expect(values.some((v) => v === 0)).toBe(true);
  expect(values.some((v) => v > 0)).toBe(true);
});
