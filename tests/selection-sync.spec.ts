import { expect, test } from "@playwright/test";
import {
  DATA,
  TEAM_CODES,
  checkedRailTeam,
  clickRailTeam,
  clickScatterPoint,
  gotoHome,
  optimizerMatchesSource,
  readOptimizerState,
  scatterPoint,
} from "./support/fixtures";

// The scatter and the rail share one selection via SelectedTeamProvider; the
// table sits between them but never consumes that context. These tests cover
// the path that shipped without coverage: selecting a team by clicking a
// scatter point directly, not just via the rail.

test.describe("scatter click selects the correct team", () => {
  // Every team, not a sample — this is exactly the class of bug (DET/OKC's
  // overlapping hit targets resolving to the wrong team) that a partial
  // sweep would have missed.
  for (const code of TEAM_CODES) {
    test(`clicking ${code}'s point drives the rail and the lineup optimizer`, async ({ page }) => {
      await gotoHome(page);
      await clickScatterPoint(page, code);

      await expect(async () => {
        expect(await checkedRailTeam(page)).toBe(code);
      }).toPass({ timeout: 2000 });

      await page.locator("#lineup-optimizer").scrollIntoViewIfNeeded();
      await expect
        .poll(async () => optimizerMatchesSource(await readOptimizerState(page), code))
        .toBe(true);
    });
  }
});

test("rail click updates the scatter's selection ring and aria-label", async ({ page }) => {
  await gotoHome(page);
  await clickRailTeam(page, "GSW");

  await page.locator('svg[role="application"]').scrollIntoViewIfNeeded();
  const point = scatterPoint(page, "GSW");
  await expect(point).toHaveAttribute("aria-label", /Selected — driving the lineup optimizer/);

  // Exactly one persistent selection ring (r=11) should exist on the chart.
  const selectionRings = page.locator('svg[role="application"] circle[r="11"]');
  await expect(selectionRings).toHaveCount(1);
});

test("selection ring persists after the pointer moves away", async ({ page }) => {
  await gotoHome(page);
  await clickScatterPoint(page, "BOS");
  await page.mouse.move(5, 5);
  await page.waitForTimeout(200);

  const point = scatterPoint(page, "BOS");
  // Hit target + persistent selection ring + fill circle = 3, with no hover ring.
  await expect(point.locator("circle")).toHaveCount(3);
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
    await clickScatterPoint(page, code);
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

  await clickScatterPoint(page, "DET");
  expect(await checkedRailTeam(page)).toBe("DET");

  await clickScatterPoint(page, "OKC");
  expect(await checkedRailTeam(page)).toBe("OKC");
});
