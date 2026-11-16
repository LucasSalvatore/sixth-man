import { test, expect } from "@playwright/test";
import { DATA } from "./support/fixtures";

// Each static card advertises its own generated image, not the site's shared image.
test("every team has a distinct route social image", async ({ page, request }) => {
  test.setTimeout(120_000);
  const images = new Set<string>();
  for (const team of DATA.teams) {
    await page.goto(`/teams/${team.team}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", new RegExp(`/teams/${team.team}$`));
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", await page.title());
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", await page.title());
    const url = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(url).toContain(`/teams/${team.team}/opengraph-image`);
    images.add(url!);
    const imagePath = new URL(url!).pathname;
    const response = await request.get(imagePath);
    expect(response.ok(), imagePath).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");
    const png = await response.body();
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  }
  expect(images.size).toBe(DATA.teams.length);
});
