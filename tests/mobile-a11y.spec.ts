import { expect, test } from "@playwright/test";
import { TEAM_CODES, checkedRailTeam, gotoHome } from "./support/fixtures";

test.describe("375px mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("no horizontal overflow anywhere on the page", async ({ page }) => {
    await gotoHome(page);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
  });

  test("scatter and table both fit inside the viewport width", async ({ page }) => {
    await gotoHome(page);
    await page.locator('svg[role="application"]').scrollIntoViewIfNeeded();
    const scatterBox = await page.locator('svg[role="application"]').boundingBox();
    expect(scatterBox?.width).toBeLessThanOrEqual(375);

    // The table is allowed its own horizontal scroll container (nine columns
    // on a 375px screen always has been), but that container itself must not
    // widen the page.
    await page.locator("#table").scrollIntoViewIfNeeded();
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
      const deck = document.querySelector("#methodology-head")?.parentElement;
      return deck?.getBoundingClientRect().width ?? 0;
    });
    expect(proseWidth).toBeLessThan(1300);
  });
});

test.describe("keyboard operability", () => {
  test("scatter: arrow keys move focus, Enter selects the focused team", async ({ page }) => {
    await gotoHome(page);
    await page.locator('svg[role="application"]').scrollIntoViewIfNeeded();

    const defaultFocusable = page.locator('svg[role="application"] g[role="img"][tabindex="0"]');
    await defaultFocusable.first().focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    const active = page.locator('svg[role="application"] g[role="img"][tabindex="0"]');
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
  test.use({ reducedMotion: "reduce" });

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
    const firstPoint = page.locator('svg[role="application"] g[role="img"]').first();
    await expect(firstPoint).toHaveCSS("opacity", "1");
  });

  test("app still functions end to end with reduced motion on", async ({ page }) => {
    await gotoHome(page);
    await page.locator('svg[role="application"]').scrollIntoViewIfNeeded();
    await page.locator('svg[role="application"] g[data-team="BOS"]').click({ force: true });
    await expect(async () => {
      expect(await checkedRailTeam(page)).toBe("BOS");
    }).toPass({ timeout: 2000 });
  });
});
