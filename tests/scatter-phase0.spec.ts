import { expect, test, type Page } from "@playwright/test";
import { DATA, TEAM_CODES, checkedRailTeam, gotoHome, optimizerMatchesSource, readOptimizerState, scatterPoint, selectScatterPoint } from "./support/fixtures";
import { formatMillions, formatSurplus, signed } from "../lib/format";

/** Calibrate from the rendered axis ticks, independently of the chart helper. */
async function axes(page: Page) {
  return page.locator('svg[role="application"]').evaluate((svg) => {
    const text = [...svg.querySelectorAll("text")];
    const xAt = (label: string) => Number(text.find((node) => node.textContent === label)?.getAttribute("x"));
    const yAt = (label: string) => {
      const tick = text.find((node) => node.textContent === label);
      return Number(tick?.parentElement?.querySelector("line")?.getAttribute("y1"));
    };
    return { x10: xAt("$10.0m"), x70: xAt("$70.0m"), yLow: yAt("−3"), yHigh: yAt("+2") };
  });
}

for (const width of [640, 768, 1440]) {
  test(`${width}px: all source team codes are legible non-overlapping chips`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await gotoHome(page);
    const points = page.locator("[data-scatter-point]");
    await expect(points).toHaveCount(TEAM_CODES.length);
    const labels = await points.locator("text").allTextContents();
    expect([...labels].sort()).toEqual([...TEAM_CODES].sort());
    const boxes = await points.locator("[data-hit]").evaluateAll((nodes) => nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { team: node.parentElement?.getAttribute("data-team"), x: box.x, y: box.y, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
    }));
    for (const box of boxes) {
      expect(box.width, `${box.team} tap width`).toBeGreaterThanOrEqual(32);
      expect(box.height, `${box.team} tap height`).toBeGreaterThanOrEqual(32);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
    }
    for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
      const first = boxes[a], second = boxes[b];
      const overlap = Math.min(first.right, second.right) > Math.max(first.x, second.x) && Math.min(first.bottom, second.bottom) > Math.max(first.y, second.y);
      expect(overlap, `${first.team} and ${second.team} chips overlap`).toBe(false);
    }
  });
}

test("scatter anchors, fair-price path, average rule, and selected surplus distance read source fields", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoHome(page);
  const frame = await axes(page);
  for (const value of Object.values(frame)) expect(Number.isFinite(value) && value !== 0).toBe(true);
  const x = (payroll: number) => frame.x10 + (payroll / 1_000_000 - 10) / 60 * (frame.x70 - frame.x10);
  const y = (wins: number) => frame.yLow + (wins + 3) / 5 * (frame.yHigh - frame.yLow);
  const anchors = await page.locator('svg[role="application"] > g[aria-hidden="true"] > line').evaluateAll((nodes) => nodes.map((node) => ({ x: Number(node.getAttribute("x1")), y: Number(node.getAttribute("y1")) })));
  const byPayroll = [...DATA.teams].sort((a, b) => a.benchPayroll - b.benchPayroll);
  expect(anchors).toHaveLength(byPayroll.length);
  for (let index = 0; index < byPayroll.length; index++) {
    expect(anchors[index].x).toBeCloseTo(x(byPayroll[index].benchPayroll), 3);
    expect(anchors[index].y).toBeCloseTo(y(byPayroll[index].benchWinsAboveAvg), 3);
  }
  const path = (await page.locator("[data-fair-price]").getAttribute("points"))!.split(" ").map((pair) => pair.split(",").map(Number));
  const byValue = [...DATA.teams].sort((a, b) => a.benchWinsAboveAvg - b.benchWinsAboveAvg);
  expect(path).toHaveLength(byValue.length);
  for (let index = 0; index < byValue.length; index++) {
    expect(path[index][0]).toBeCloseTo(x(byValue[index].fairMarketBenchPayroll), 3);
    expect(path[index][1]).toBeCloseTo(y(byValue[index].benchWinsAboveAvg), 3);
  }
  const average = page.locator("[data-payroll-average]");
  await expect(average).toHaveAttribute("data-value", String(DATA.meta.leagueAvgBenchPayroll));
  expect(Number(await average.getAttribute("x1"))).toBeCloseTo(x(DATA.meta.leagueAvgBenchPayroll), 3);
  expect(await average.getAttribute("x2")).toBe(await average.getAttribute("x1"));
  const team = DATA.teams.find((entry) => entry.benchSurplusValue < 0)!;
  await selectScatterPoint(page, team.team);
  const distance = page.locator("[data-surplus-distance]");
  expect(Number(await distance.getAttribute("x1"))).toBeCloseTo(x(team.benchPayroll), 3);
  expect(Number(await distance.getAttribute("x2"))).toBeCloseTo(x(team.fairMarketBenchPayroll), 3);
  expect(Number(await distance.getAttribute("y1"))).toBeCloseTo(y(team.benchWinsAboveAvg), 3);
  expect(await distance.getAttribute("y2")).toBe(await distance.getAttribute("y1"));
  const detail = page.locator("[data-scatter-detail]");
  for (const value of [formatMillions(team.benchPayroll), formatSurplus(team.benchSurplusValue), signed(team.benchWinsAboveAvg, 1)]) await expect(detail).toContainText(value);
});

test("desktop pointer opens the team card and back restores the rail, point, and optimizer", async ({ page }) => {
  const code = TEAM_CODES[TEAM_CODES.length - 1];
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoHome(page);
  await scatterPoint(page, code).locator("[data-hit]").click();
  await expect(page).toHaveURL(new RegExp(`/teams/${code}$`));
  expect(await page.evaluate(() => sessionStorage.getItem("deep-bench:selected"))).toBe(code);
  await page.goBack();
  await expect(page).toHaveURL(/\/bench$/);
  await expect.poll(() => checkedRailTeam(page)).toBe(code);
  await expect(scatterPoint(page, code)).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => optimizerMatchesSource(await readOptimizerState(page), code)).toBe(true);
});

test("keyboard focus is visible while a physical pointer press adds no browser focus box", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoHome(page);
  const point = page.locator('[data-scatter-point][tabindex="0"]').first();
  await page.keyboard.press("Tab");
  await point.focus();
  expect(await point.evaluate((node) => node.matches(":focus-visible"))).toBe(true);
  await expect(point).toHaveCSS("outline-style", "solid");
  expect(parseFloat(await point.evaluate((node) => getComputedStyle(node).outlineWidth))).toBeGreaterThanOrEqual(2);
  await page.keyboard.press("ArrowRight");
  const next = page.locator('[data-scatter-point][tabindex="0"]').first();
  await expect(next).toBeFocused();
  await page.keyboard.press("Space");
  await expect(next).toHaveAttribute("aria-pressed", "true");
  // Inspect after real pointer-down, before mouse-up causes navigation.
  await page.locator("[data-scatter] > p").first().click();
  const target = scatterPoint(page, TEAM_CODES[0]);
  await target.locator("[data-hit]").scrollIntoViewIfNeeded();
  const box = (await target.locator("[data-hit]").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect(await target.evaluate((node) => node.matches(":focus-visible"))).toBe(false);
  await expect(target).toHaveCSS("outline-style", "none");
  await page.mouse.move(2, 70);
  await page.mouse.up();
});

test.describe("touch details", () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });
  test("first tap pins source details without navigation; the card link opens the selected team", async ({ page }) => {
    await gotoHome(page);
    const team = DATA.teams[DATA.teams.length - 1];
    await selectScatterPoint(page, team.team);
    await expect(page).toHaveURL(/\/bench$/);
    await expect.poll(() => checkedRailTeam(page)).toBe(team.team);
    await page.locator("[data-scatter] > p").first().tap();
    const detail = page.locator("[data-scatter-detail]");
    await detail.scrollIntoViewIfNeeded();
    await expect(detail).toContainText(formatSurplus(team.benchSurplusValue));
    await expect(detail).toContainText(formatMillions(team.benchPayroll));
    const link = detail.getByRole("link", { name: "Open team card" });
    await expect(link).toHaveAttribute("href", `/teams/${team.team}`);
    await link.tap();
    await expect(page).toHaveURL(new RegExp(`/teams/${team.team}$`));
  });
});


test("375px without JavaScript: source overview and complete team values remain readable", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto("/bench");
  await expect(page.locator("[data-scatter] [data-preview-team]")).toHaveCount(DATA.teams.length);
  await expect(page.locator("[data-team-card]")).toHaveCount(DATA.teams.length);
  await expect(page.locator("[data-scatter] svg")).toHaveAttribute("role", "img");
  await expect(page.locator("[data-scatter]")).not.toContainText("Click a code");
  await expect(page.locator("[data-scatter]")).not.toContainText("Horizontal dotted distance");
  for (const team of DATA.teams) {
    await expect(page.locator(`[data-team-card="${team.team}"]`)).toContainText(formatSurplus(team.benchSurplusValue));
  }
  expect(await page.locator(".scatter-frame").evaluate((node) => node.getBoundingClientRect().height)).toBe(480);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
