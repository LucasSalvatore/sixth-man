import { expect, test, type Locator } from "@playwright/test";
import { formatPercent, sourcePrecision } from "../lib/format";
import { DATA, TEAM_CODES } from "./support/fixtures";

async function expectSnapshot(snapshot: Locator) {
  await expect(snapshot).toBeVisible();
  await expect(snapshot).toContainText(DATA.meta.asOf);
  await expect(snapshot).toContainText(DATA.meta.asOfNote);
  await expect(snapshot).toContainText(DATA.meta.source);
  await expect(snapshot).toContainText(DATA.meta.seasonLabel);
}

for (const path of ["/", "/bench"]) {
  test(`${path}: masthead presents the snapshot label, its qualification, and source`, async ({ page }) => {
    await page.goto(path);
    const snapshot = page.locator("main header [data-snapshot]");
    await expect(snapshot).toHaveCount(1);
    await expectSnapshot(snapshot);
  });
}

for (const code of TEAM_CODES) {
  test(`${code}: team card presents the same qualified source metadata`, async ({ page }) => {
    await page.goto(`/teams/${code}`);
    const snapshot = page.locator("main [data-snapshot]");
    await expect(snapshot).toHaveCount(1);
    await expectSnapshot(snapshot);
  });
}

test("methodology reproduces every source disclosure and formula without drifting", async ({ page }) => {
  await page.goto("/method");
  const disclosures = page.locator('main section[id^="note-"] > p');
  await expect(disclosures).toHaveCount(DATA.meta.disclosures.length);
  await expect(disclosures).toHaveText(DATA.meta.disclosures);
  for (const text of [DATA.meta.winsFormula, DATA.meta.benchSurplusFormula, DATA.meta.starterBenchShareNote]) {
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  }
  await expect(page.getByText(`Source: ${DATA.meta.season_source}`, { exact: true })).toBeVisible();
  const regression = page.locator("main p").filter({ hasText: "Source-reported correlation:" });
  await expect(regression).toContainText(`r = ${sourcePrecision(DATA.meta.r)}`);
  await expect(regression).toContainText(`explained variance: ${formatPercent(DATA.meta.r2)}`);
  await expectSnapshot(page.locator("main [data-snapshot]"));
});

test("hero and root descriptions use the recorded explained-variance field", async ({ page }) => {
  await page.goto("/");
  const selectors = ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]'];
  const descriptions: string[] = [];
  for (const selector of selectors) {
    const metadata = page.locator(selector);
    await expect(metadata).toHaveCount(1);
    const description = await metadata.getAttribute("content");
    expect(description).toContain(`about ${formatPercent(DATA.meta.r2)} of the variance in bench quality`);
    descriptions.push(description!);
  }
  expect(new Set(descriptions).size).toBe(1);

  await page.goto("/bench");
  await expect(page.locator("main header")).toContainText(`Bench payroll explains about ${formatPercent(DATA.meta.r2)} of the variance in bench quality.`);
  await expect(page.locator("main header")).toContainText(DATA.meta.seasonLabel);
});

test("homepage scatter is a single link with every source team and no point controls", async ({ page }) => {
  await page.goto("/");
  const preview = page.locator("[data-scatter-preview]");
  await expect(preview).toHaveCount(1);
  await expect(preview).toHaveAttribute("href", "/bench");
  await expect(preview.locator("[data-preview-team]")).toHaveCount(DATA.teams.length);
  expect(await preview.locator("[data-preview-team]").evaluateAll((points) => points.map((point) => point.getAttribute("data-preview-team")).sort()))
    .toEqual([...TEAM_CODES].sort());
  await expect(preview.locator('a, button, input, select, textarea, [role="button"], [role="link"], [tabindex]')).toHaveCount(0);
  await preview.click();
  await expect(page).toHaveURL(/\/bench$/);
});

for (const width of [375, 1440]) {
  for (const path of ["/", "/bench", "/teams", `/teams/${TEAM_CODES[0]}`, "/method"]) {
    test(`${width}px ${path}: rendered text uses the five-step scale with a 12px floor`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path, { waitUntil: "networkidle" });

      const result = await page.evaluate(() => {
        // Resolve the display token in this viewport; the other four steps
        // are the design contract, not a list copied from current elements.
        const probe = document.createElement("span");
        probe.style.fontSize = "var(--type-display)";
        document.body.append(probe);
        const displaySize = parseFloat(getComputedStyle(probe).fontSize);
        probe.remove();
        const allowed = [12, 15, 20, 34, displaySize];
        const textElements = [...document.body.querySelectorAll("*")].filter((element) => {
          if (!element.getClientRects().length || element.closest(".sr-only")) return false;
          const style = getComputedStyle(element);
          if (style.visibility !== "visible" || style.display === "none") return false;
          return [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
        });
        const invalid = textElements.flatMap((element) => {
          const size = parseFloat(getComputedStyle(element).fontSize);
          if (element.classList.contains("text-display")) {
            // The display tier is fluid and scoped for the team-band numeral.
            const probe = document.createElement("span");
            probe.style.fontSize = "var(--type-display)";
            element.append(probe);
            const localDisplay = parseFloat(getComputedStyle(probe).fontSize);
            probe.remove();
            if (Math.abs(size - localDisplay) < 0.05 && size >= 34) return [];
          }
          if (allowed.some((step) => Math.abs(step - size) < 0.05)) return [];
          return [{ element: element.tagName, text: element.textContent?.trim().slice(0, 65), size }];
        });
        return { count: textElements.length, invalid };
      });
      expect(result.count).toBeGreaterThan(0);
      expect(result.invalid).toEqual([]);
    });
  }

  test(`${width}px: visible Money currency symbols and units are at least 12px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/bench", { waitUntil: "networkidle" });
    const units = await page.locator("span").evaluateAll((elements) => elements
      .filter((element) => element.getClientRects().length > 0 && /^[$m]$/.test(element.textContent?.trim() ?? "") && getComputedStyle(element).visibility === "visible")
      .map((element) => ({ text: element.textContent, size: parseFloat(getComputedStyle(element).fontSize) })));
    expect(units.length).toBeGreaterThan(0);
    for (const unit of units) expect(unit.size, `${unit.text} must remain legible`).toBeGreaterThanOrEqual(12);
  });
}
