import { expect, test } from "@playwright/test";
import {
  DATA,
  TEAM_CODES,
  checkedRailTeam,
  clickRailTeam,
  selectScatterPoint,
  gotoHome,
  optimizerMatchesSource,
  readOptimizerState,
  scatterPoint,
} from "./support/fixtures";

// The scatter and the rail share one selection via SelectedTeamProvider; the
// table sits between them but never consumes that context. These tests cover
// the path that shipped without coverage: selecting a team by clicking a
// scatter via touch or keyboard, not just via the rail.

for (const mode of [
  { name: "desktop keyboard", viewport: { width: 1440, height: 1000 }, hasTouch: false },
  { name: "mobile touch", viewport: { width: 375, height: 812 }, hasTouch: true },
]) {
  test.describe(`${mode.name}: scatter selects the correct team`, () => {
    test.use({ viewport: mode.viewport, hasTouch: mode.hasTouch });
    // Every source team: includes nearby points that previously resolved wrongly.
    for (const code of TEAM_CODES) {
      test(`selecting ${code}'s point drives the rail and both panels`, async ({ page }) => {
        await gotoHome(page);
        await selectScatterPoint(page, code);
        await expect(page).toHaveURL(/\/bench$/);
        await expect(async () => {
          expect(await checkedRailTeam(page)).toBe(code);
        }).toPass({ timeout: 2000 });
        await page.locator("#lineup-optimizer").scrollIntoViewIfNeeded();
        await expect.poll(async () => optimizerMatchesSource(await readOptimizerState(page), code)).toBe(true);
        await expect(page.locator(`[data-minutes-panel="${code}"]`)).toBeVisible();
      });
    }
  });
}

test("rail click updates the scatter's selection ring and aria-label", async ({ page }) => {
  await gotoHome(page);
  await clickRailTeam(page, "GSW");

  await page.locator('svg[role="application"]').scrollIntoViewIfNeeded();
  const point = scatterPoint(page, "GSW");
  await expect(point).toHaveAttribute("aria-label", /Selected — driving the lineup optimizer/);

  // The persistent selection marker has the same semantic hook for chips and dots.
  const selectionRings = page.locator('[data-selection-ring]');
  await expect(selectionRings).toHaveCount(1);
});

test("selection ring persists after the pointer moves away", async ({ page }) => {
  await gotoHome(page);
  await selectScatterPoint(page, "BOS");
  await page.mouse.move(5, 5);
  await page.waitForTimeout(200);

  const point = scatterPoint(page, "BOS");
  await expect(point.locator("[data-selection-ring]")).toHaveCount(1);
  await expect(point).toHaveAttribute("aria-pressed", "true");
});

test("the table never re-renders when selection changes via either path", async ({ page }) => {
  await gotoHome(page);
  await page.locator("#table").scrollIntoViewIfNeeded();

  await page.evaluate(() => {
    (window as unknown as { __mutations: number }).__mutations = 0;
    const tbody = document.querySelector("tbody");
    const observer = new MutationObserver((records) => {
      (window as unknown as { __mutations: number }).__mutations += records.length;
    });
    if (tbody) observer.observe(tbody, { childList: true, subtree: true, attributes: true });
    (window as unknown as { __obs: MutationObserver }).__obs = observer;
  });

  for (const code of ["PHX", "DET", "OKC", "GSW", "BKN"]) {
    await selectScatterPoint(page, code);
    await page.waitForTimeout(30);
  }
  for (const code of ["CLE", "DAL", "MEM"]) {
    await clickRailTeam(page, code);
    await page.waitForTimeout(30);
  }

  const mutations = await page.evaluate(() => {
    (window as unknown as { __obs: MutationObserver }).__obs.disconnect();
    return (window as unknown as { __mutations: number }).__mutations;
  });
  expect(mutations).toBe(0);
  expect(await page.locator("tbody tr[data-flip-key]").count()).toBe(TEAM_CODES.length);
});

test("DET and OKC — the pair whose overlapping hit targets caused a wrong selection — resolve independently", async ({
  page,
}) => {
  test.skip(!DATA.lineups.DET || !DATA.lineups.OKC, "source has no lineup for DET or OKC");
  await gotoHome(page);

  await selectScatterPoint(page, "DET");
  expect(await checkedRailTeam(page)).toBe("DET");

  await selectScatterPoint(page, "OKC");
  expect(await checkedRailTeam(page)).toBe("OKC");
});
