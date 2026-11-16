import { expect, test } from "@playwright/test";
import { DATA, TEAM_CODES } from "./support/fixtures";

// The multi-route shell: front door, team index, a card per team, method.
// Expected figures are formatted from the same JSON the pages render from.

const surplus = (v: number) => `${v < 0 ? "−" : "+"}$${(Math.abs(v) / 1_000_000).toFixed(1)}m`;
const team = (code: string) => DATA.teams.find((t) => t.team === code) as unknown as { benchSurplusValue: number };

test("primary nav reaches every destination and marks the current one", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" }).first();
  for (const [label, path] of [["Bench value", "/bench"], ["Teams", "/teams"], ["Method", "/method"], ["Today", "/"]] as const) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("navigation", { name: "Primary" }).first().getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    await expect(page.locator("h1")).toHaveCount(1);
  }
});

test("front door shows one bench of the day whose figure matches the source", async ({ page }) => {
  await page.goto("/");
  const holder = page.locator("[data-bench-of-the-day]");
  const code = await holder.getAttribute("data-bench-of-the-day");
  expect(TEAM_CODES).toContain(code);
  const band = page.locator(`[data-team-flood="${code}"]`);
  await expect(band).toBeVisible();
  await expect(band).toContainText(surplus(team(code!).benchSurplusValue));
  await expect(page.locator("[data-team-flood]:visible")).toHaveCount(1);
});

test("every team has a card whose lead figure matches the source", async ({ page }) => {
  for (const code of TEAM_CODES) {
    const response = await page.goto(`/teams/${code}`);
    expect(response?.status(), code).toBe(200);
    await expect(page.locator(`[data-team-flood="${code}"]`)).toContainText(surplus(team(code).benchSurplusValue));
    await expect(page.locator("#lineup-optimizer")).toBeVisible();
    await expect(page.locator("#minutes-plan")).toBeVisible();
  }
});

test("an unknown team code is a 404, not an empty card", async ({ page }) => {
  const response = await page.goto("/teams/XXX");
  expect(response?.status()).toBe(404);
});

test("team index links all thirty cards; table rows link to cards", async ({ page }) => {
  await page.goto("/teams");
  await expect(page.locator('main a[href^="/teams/"]')).toHaveCount(TEAM_CODES.length);
  await page.goto("/bench");
  await expect(page.locator('tbody a[href^="/teams/"]')).toHaveCount(TEAM_CODES.length);
});

for (const path of ["/", "/teams", "/teams/BOS", "/method"]) {
  test(`375px: no horizontal overflow on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(path, { waitUntil: "networkidle" });
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(over).toBe(false);
  });
}
