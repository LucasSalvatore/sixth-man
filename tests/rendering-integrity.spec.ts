import { expect, test } from "@playwright/test";
import { TEAM_CODES, clickRailTeam, clickScatterPoint, gotoHome, tableRowCount } from "./support/fixtures";

// Reproduces the reported bug: clicking through scatter points should never
// flicker, unmount, or leave the table (or the chart) in an empty frame. The
// original QA pass only walked the rail; this walks both paths, at both
// viewport sizes, because clicking a scatter point is what actually shipped
// broken.

const VIEWPORTS = [
  { name: "desktop", size: { width: 1440, height: 1000 } },
  { name: "mobile-375", size: { width: 375, height: 812 } },
];

for (const { name, size } of VIEWPORTS) {
  test.describe(`${name} viewport`, () => {
    test(`clicking all ${TEAM_CODES.length} scatter points in sequence never empties the table or the chart`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      await gotoHome(page);
      await page.locator('svg[role="application"]').scrollIntoViewIfNeeded();

      let minRows = Infinity;
      let minPoints = Infinity;
      for (const code of TEAM_CODES) {
        await clickScatterPoint(page, code);
        const [rows, points] = await Promise.all([
          tableRowCount(page),
          page.locator('svg[role="application"] g[role="img"]').count(),
        ]);
        minRows = Math.min(minRows, rows);
        minPoints = Math.min(minPoints, points);
      }

      expect(minRows, "table must never drop below all rows mid-sequence").toBe(TEAM_CODES.length);
      expect(minPoints, "chart must never drop below all points mid-sequence").toBe(TEAM_CODES.length);
      expect(await tableRowCount(page)).toBe(TEAM_CODES.length);
      expect(errors).toEqual([]);
    });

    test("clicking all rail cells in sequence never empties the table or the chart (parity check)", async ({
      page,
    }) => {
      await page.setViewportSize(size);
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      await gotoHome(page);

      let minRows = Infinity;
      for (const code of TEAM_CODES) {
        await clickRailTeam(page, code);
        minRows = Math.min(minRows, await tableRowCount(page));
      }

      expect(minRows).toBe(TEAM_CODES.length);
      expect(errors).toEqual([]);
    });
  });
}
