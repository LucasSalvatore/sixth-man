import { expect, test } from "@playwright/test";
import { formatMillions, formatSurplus, signed } from "../lib/format";
import { DATA, gotoHome } from "./support/fixtures";

test("375px: every team card shows source values and its team link", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoHome(page);

  const cards = page.getByTestId("team-cards");
  await expect(cards).toBeVisible();
  await expect(cards.locator("[data-team-card]")).toHaveCount(DATA.teams.length);
  await expect(page.locator("table")).toBeHidden();
  await expect(page.getByLabel("Sort teams by")).toHaveValue("benchSurplusValue");

  for (const team of DATA.teams) {
    const card = cards.locator(`[data-team-card="${team.team}"]`);
    await expect(card.locator("a")).toHaveAttribute("href", `/teams/${team.team}`);
    await expect(card.locator("[data-field=surplus]")).toHaveText(formatSurplus(team.benchSurplusValue));
    await expect(card.locator("[data-field=bench-wins]")).toHaveText(signed(team.benchWinsAboveAvg));
    await expect(card.locator("[data-field=payroll]")).toHaveText(formatMillions(team.benchPayroll));
  }

  const descendingSurplus = [...DATA.teams].sort((a, b) =>
    b.benchSurplusValue - a.benchSurplusValue || b.projWins - a.projWins || a.team.localeCompare(b.team),
  ).map((team) => team.team);
  expect(await cards.locator("[data-team-card]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-team-card"))))
    .toEqual(descendingSurplus);
});

test("sort controls and column headers share order across responsive views", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoHome(page);
  await page.getByLabel("Sort teams by").selectOption("benchPayroll");
  await page.getByRole("button", { name: "Reverse team sort order" }).click();

  const ascendingPayroll = [...DATA.teams].sort((a, b) =>
    a.benchPayroll - b.benchPayroll || b.projWins - a.projWins || a.team.localeCompare(b.team),
  ).map((team) => team.team);
  expect(await page.locator("[data-team-card]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-team-card"))))
    .toEqual(ascendingPayroll);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator("table")).toBeVisible();
  await expect(page.getByTestId("team-cards")).toBeHidden();
  await expect(page.getByRole("columnheader", { name: "Bench payroll" })).toHaveAttribute("aria-sort", "ascending");
  expect(await page.locator("tbody tr[data-flip-key]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-flip-key"))))
    .toEqual(ascendingPayroll);

  await page.getByRole("button", { name: "Surplus value", exact: true }).click();
  await expect(page.getByLabel("Sort teams by")).toHaveValue("benchSurplusValue");
  await expect(page.getByRole("columnheader", { name: "Surplus value" })).toHaveAttribute("aria-sort", "descending");
  await page.setViewportSize({ width: 375, height: 812 });
  const best = [...DATA.teams].sort((a, b) => b.benchSurplusValue - a.benchSurplusValue)[0];
  await expect(page.locator("[data-team-card]").first()).toHaveAttribute("data-team-card", best.team);
});

test("desktop table header stays directly below the site navigation while scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoHome(page);
  await page.locator("table").evaluate((table) => {
    window.scrollTo(0, table.getBoundingClientRect().top + window.scrollY + 180);
  });
  for (const header of await page.locator("thead th").all()) {
    await expect.poll(async () => Math.round((await header.boundingBox())?.y ?? -1)).toBe(56);
  }
});

for (const width of [375, 768, 1024, 1280, 1440]) {
  test(`${width}px: team comparison stays inside the viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await gotoHome(page);
    await page.locator("#table").scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const surface = width >= 1280 ? page.locator("table") : page.getByTestId("team-cards");
    const box = await surface.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  });
}

for (const width of [375, 1440]) {
  test(`${width}px: flags have touch-sized controls and expose source disclosures`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await gotoHome(page);
    const controls = page.locator("[data-flag-toggle]:visible");
    const flaggedTeams = DATA.teams.filter((team) => team.dataFlags.length > 0);
    await expect(controls).toHaveCount(flaggedTeams.length);
    for (const button of await controls.all()) {
      const box = await button.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(32);
      expect(box!.height).toBeGreaterThanOrEqual(32);
    }

    const team = flaggedTeams[0];
    expect(team).toBeDefined();
    const surface = width < 1280
      ? page.locator(`[data-team-card="${team.team}"]`)
      : page.locator(`tbody tr[data-flip-key="${team.team}"]`);
    const button = surface.locator("[data-flag-toggle]");
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    const details = width < 1280 ? surface : surface.locator("xpath=following-sibling::tr[1]");
    for (const flag of team.dataFlags) {
      await expect(details.getByText(flag.player, { exact: true })).toBeVisible();
      await expect(details.getByText(flag.note, { exact: true })).toBeVisible();
    }
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });
}
