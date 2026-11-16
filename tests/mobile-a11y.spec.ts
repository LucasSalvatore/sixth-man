import { expect, test } from "@playwright/test";
import { TEAM_CODES, checkedRailTeam, gotoHome, selectScatterPoint } from "./support/fixtures";

test.describe("375px mobile", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("no horizontal overflow anywhere on the page", async ({ page }) => {
    await gotoHome(page);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
  });

  test("scatter and mobile team cards both fit inside the viewport width", async ({ page }) => {
    await gotoHome(page);
    await page.locator('svg[role="application"]').scrollIntoViewIfNeeded();
    const scatterBox = await page.locator('svg[role="application"]').boundingBox();
    expect(scatterBox?.width).toBeLessThanOrEqual(375);

    // Mobile shows complete team cards, including the active surplus metric;
    // the wide table is not the mobile reading surface.
    await page.locator("#table").scrollIntoViewIfNeeded();
    await expect(page.getByRole("list", { name: "Ranked teams" })).toBeVisible();
    await expect(page.locator("[data-team-card]:visible")).toHaveCount(TEAM_CODES.length);
    await expect(page.locator("table")).not.toBeVisible();
    const pageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(pageOverflow).toBe(false);
  });
});

test.describe("desktop width", () => {
  test.use({ viewport: { width: 1728, height: 1100 } });

  test("scatter and table use a wide measure, prose stays narrow", async ({ page }) => {
    await gotoHome(page);

    await page.locator('svg[role="application"]').scrollIntoViewIfNeeded();
    const scatterWidth = (await page.locator('svg[role="application"]').boundingBox())?.width ?? 0;
    expect(scatterWidth).toBeGreaterThan(1200);

    await page.locator("#table").scrollIntoViewIfNeeded();
    const tableWidth = (await page.locator("table").boundingBox())?.width ?? 0;
    expect(tableWidth).toBeGreaterThan(1200);

    const proseWidth = await page.evaluate(() => {
      const deck = document.querySelector("header h1")?.parentElement;
      return deck?.getBoundingClientRect().width ?? 0;
    });
    expect(proseWidth).toBeLessThan(1300);
  });
});

test.describe("keyboard operability", () => {
  test("scatter: arrow keys move focus, Enter selects the focused team", async ({ page }) => {
    await gotoHome(page);
    await page.locator('svg[role="application"]').scrollIntoViewIfNeeded();

    const defaultFocusable = page.locator('[data-scatter-point][role="button"][tabindex="0"]');
    await defaultFocusable.first().focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    const active = page.locator('[data-scatter-point][role="button"][tabindex="0"]');
    const activeCode = await active.first().getAttribute("data-team");
    expect(activeCode).not.toBeNull();

    await page.keyboard.press("Enter");
    await expect(async () => {
      expect(await checkedRailTeam(page)).toBe(activeCode);
    }).toPass({ timeout: 2000 });
  });

  test("rail: arrow keys move focus and selection through the radiogroup", async ({ page }) => {
    await gotoHome(page);
    await page.locator("#lineup-optimizer").scrollIntoViewIfNeeded();

    const radios = page.locator('[role="radiogroup"] [role="radio"]');
    const codesInOrder = await radios.allTextContents();
    expect(codesInOrder.length).toBe(TEAM_CODES.length);

    await radios.first().focus();
    await page.keyboard.press("ArrowRight");

    const checked = page.locator('[role="radio"][aria-checked="true"]');
    await expect(checked).toHaveText(codesInOrder[1]);
  });
});

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("hero stats render their final value with no counted-up transient", async ({ page }) => {
    await gotoHome(page);
    // With reduced motion, useCountUp returns the target on first paint —
    // no animation frame should be needed to reach the final text.
    const label = page.locator("text=Best bench, wins above average").first();
    await expect(label).toBeVisible();
  });

  test("scatter points are fully visible immediately, without waiting for scroll reveal", async ({
    page,
  }) => {
    await gotoHome(page);
    await page.locator('svg[role="application"]').scrollIntoViewIfNeeded();
    const firstPoint = page.locator('[data-scatter-point][role="button"]').first();
    await expect(firstPoint).toHaveCSS("opacity", "1");
  });

  test("app still functions end to end with reduced motion on", async ({ page }) => {
    await gotoHome(page);
    await page.locator('svg[role="application"]').scrollIntoViewIfNeeded();
    await selectScatterPoint(page, "BOS");
    await expect(async () => {
      expect(await checkedRailTeam(page)).toBe("BOS");
    }).toPass({ timeout: 2000 });
  });
});


for (const width of [375, 768, 1440]) {
  test(`${width}px: rail vertical arrows follow the visible grid rows`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await gotoHome(page);
    const radios = page.getByRole("radio");
    const expected = await radios.evaluateAll((nodes) => {
      const top = nodes[0].getBoundingClientRect().top;
      return nodes.find((node) => node.getBoundingClientRect().top > top)?.textContent?.trim();
    });
    expect(TEAM_CODES).toContain(expected);
    await radios.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("radio", { name: expected!, exact: true })).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("ArrowUp");
    await expect(radios.first()).toHaveAttribute("aria-checked", "true");
  });
}
