import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

// Run against an already-served production build; this script never starts or
// rebuilds the application. The same capture works locally and in GitHub CI.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || process.env.AUDIT_BASE_URL || "http://127.0.0.1:4100";
const output = path.resolve("artifacts/phase0/screenshots");
const routes = ["/", "/bench", "/teams", "/teams/BOS", "/method"];
const manifest = [];
const sectionStyle = "body > .sticky { position: static !important; } body > nav.fixed { visibility: hidden !important; }";

await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || chromium.executablePath(),
});

async function prepare(page, route, javascript = true) {
  const response = await page.goto(route, { waitUntil: "networkidle" });
  if (response?.status() !== 200) throw new Error(`${route} returned ${response?.status()}`);
  await page.evaluate(() => document.fonts.ready);
  if (javascript && route === "/bench") {
    await page.locator('svg[role="application"]').waitFor({ state: "visible" });
  }
  // Visit the whole document before a full-page capture so any scroll reveals
  // have reached their settled state. Reduced motion is enabled in each context.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    window.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
}

async function capture(page, prefix, name, locator, javascript = true) {
  const filename = `${prefix}-${name}.png`;
  if (locator) {
    await locator.waitFor({ state: "visible" });
    await locator.scrollIntoViewIfNeeded();
    // Element captures suppress navigation overlays; full-page captures retain
    // the actual site navigation and therefore document its responsive layout.
    await locator.screenshot({ path: path.join(output, filename), animations: "disabled", style: sectionStyle });
  } else {
    await page.screenshot({ path: path.join(output, filename), fullPage: true, animations: "disabled" });
  }
  manifest.push({ filename, url: page.url(), viewport: page.viewportSize(), javascript, elementNavigationSuppressed: Boolean(locator) });
}

try {
  for (const width of [1440, 375]) {
    const context = await browser.newContext({
      baseURL,
      viewport: { width, height: width === 375 ? 812 : 1000 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
      hasTouch: width === 375,
      isMobile: width === 375,
    });
    try {
      const page = await context.newPage();
      for (const route of routes) {
        const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
        const prefix = `${width}-${slug}`;
        await prepare(page, route);
        await capture(page, prefix, "full-page");
        if (route === "/" || route === "/teams/BOS") {
          await capture(page, prefix, "team-band", page.locator("[data-team-flood]:visible"));
        }
        if (route === "/bench") {
          await capture(page, prefix, "scatter", page.locator("[data-scatter]"));
          await capture(page, prefix, width === 375 ? "team-cards" : "table",
            width === 375 ? page.getByTestId("team-cards") : page.locator("table"));
        }
        if (route === "/bench" || route === "/teams/BOS") {
          await capture(page, prefix, "lineup", page.locator("[data-lineup-panel]"));
          await capture(page, prefix, "minutes", page.locator("[data-minutes-panel]"));
        }
      }
    } finally {
      await context.close();
    }
  }

  const context = await browser.newContext({
    baseURL,
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    javaScriptEnabled: false,
  });
  try {
    const page = await context.newPage();
    await prepare(page, "/bench", false);
    const scatter = page.locator("[data-scatter]");
    const copy = await scatter.innerText();
    if (!copy.includes("This overview plots each team’s source payroll and bench value.") ||
        copy.includes("Click a code") || copy.includes("Horizontal dotted distance")) {
      throw new Error("The JavaScript-disabled scatter has misleading interactive instructions.");
    }
    await capture(page, "375-bench-nojs", "full-page", undefined, false);
    await capture(page, "375-bench-nojs", "scatter", scatter, false);
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(path.join(output, "manifest.json"), `${JSON.stringify({ baseURL, screenshots: manifest }, null, 2)}\n`);
}

console.log(`Captured ${manifest.length} Phase 0 screenshots in ${output}`);
