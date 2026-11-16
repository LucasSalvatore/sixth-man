import { expect, test } from "@playwright/test";
import { DATA, TEAM_CODES, clickRailTeam, gotoHome } from "./support/fixtures";
import type { DeepBenchData } from "../lib/types";
import { formatMillions, formatMinutes, signed, sourcePrecision } from "../lib/format";

const source = DATA as unknown as DeepBenchData;

test.use({ reducedMotion: "reduce" });

for (const width of [1440, 375]) {
  test(`${width}px: every optimizer shows one merged roster with source values and full names`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 1000 });
    await gotoHome(page);
    for (const code of TEAM_CODES) {
      await clickRailTeam(page, code);
      const lineup = source.lineups[code];
      const panel = page.locator(`[data-lineup-panel="${code}"]`);
      const current = new Set(lineup.current.map((p) => p.name));
      const optimal = new Set(lineup.optimal.map((p) => p.name));
      const players = lineup.gainWins === 0 ? lineup.current : [
        ...lineup.current,
        ...lineup.optimal.filter((p) => !current.has(p.name)),
      ];
      await expect(panel.locator("ul")).toHaveCount(1);
      await expect(panel.locator("[data-lineup-player]")).toHaveCount(players.length);
      const gain = panel.locator("[data-lineup-gain]");
      if (lineup.gainWins === 0) {
        await expect(gain).toContainText("Already optimal");
        await expect(panel.locator('[data-lineup-status="demoted"], [data-lineup-status="promoted"]')).toHaveCount(0);
      } else {
        await expect(gain).toContainText(signed(lineup.gainWins, 2));
        await expect(gain).toContainText(`${sourcePrecision(lineup.curLineupBPM)} → ${sourcePrecision(lineup.optLineupBPM)}`);
        await expect(panel.locator('[data-lineup-status="demoted"]')).toHaveCount(lineup.current.filter((p) => !optimal.has(p.name)).length);
        await expect(panel.locator('[data-lineup-status="promoted"]')).toHaveCount(lineup.optimal.filter((p) => !current.has(p.name)).length);
      }
      for (const player of players) {
        const row = panel.locator("[data-lineup-player]").filter({ has: page.locator("[data-player-name]", { hasText: player.name }) });
        await expect(row).toHaveCount(1);
        await expect(row.locator("[data-player-name]")).toHaveText(player.name);
        await expect(row).toContainText(signed(player.bpm, 1));
        await expect(row).toContainText(player.salary === null ? "Unsigned" : formatMillions(player.salary));
        const nameFits = await row.locator("[data-player-name]").evaluate((node) => {
          const style = getComputedStyle(node);
          return style.textOverflow !== "ellipsis" && node.scrollWidth <= node.clientWidth && node.scrollHeight <= node.clientHeight;
        });
        expect(nameFits, `${code}: ${player.name} must be fully readable`).toBe(true);
      }
      await expect(panel).toContainText(source.meta.starterBenchShareNote);
    }
  });
}

test("minutes legend explains all marks and displayed values come from the selected team's source", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoHome(page);
  // Include a team with prior/modelled flags, if present, without hard-coding a roster.
  const code = TEAM_CODES.find((key) => source.minutes[key].some((row) => row.imputed)) ?? TEAM_CODES[0];
  await clickRailTeam(page, code);
  const panel = page.locator(`[data-minutes-panel="${code}"]`);
  const legend = panel.getByRole("list", { name: "Minutes plan legend" });
  await expect(legend).toContainText("Current minutes");
  await expect(legend).toContainText("Optimal minutes");
  await expect(legend).toContainText(`Model ceiling ${formatMinutes(source.meta.minutesCeiling)}`);
  await expect(panel.locator("[data-minutes-player]")).toHaveCount(source.minutes[code].length);
  for (const player of source.minutes[code]) {
    const row = panel.locator("[data-minutes-player]").filter({ has: page.locator("[data-player-name]", { hasText: player.name }) });
    await expect(row).toContainText(`${formatMinutes(player.cur)} → ${formatMinutes(player.opt)}`);
    if (player.delta !== 0) await expect(row).toContainText(signed(player.delta, 1));
    await expect(row.locator("[data-player-name]")).toHaveText(player.name);
  }
});

test("team panels render their source values and minutes marks with JavaScript disabled", async ({ browser, baseURL }) => {
  const code = TEAM_CODES.find((key) => source.lineups[key].gainWins > 0)!;
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  try {
    await page.goto(`/teams/${code}`);
    await expect(page.locator("[data-lineup-gain]")).toContainText(signed(source.lineups[code].gainWins, 2));
    const row = page.locator("[data-minutes-player]").first();
    await row.scrollIntoViewIfNeeded();
    const mark = row.locator("[data-minutes-current]");
    expect((await mark.boundingBox())?.width).toBeGreaterThan(0);
    await expect(mark).toHaveCSS("transform", "none");
    await expect(row.locator("[data-minutes-optimal]")).toBeVisible();
    await expect(page.getByRole("list", { name: "Minutes plan legend" })).toBeVisible();
  } finally {
    await context.close();
  }
});
