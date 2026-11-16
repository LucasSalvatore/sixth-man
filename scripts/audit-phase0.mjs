#!/usr/bin/env node
// Run against an existing production server. This script never builds or writes .next.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from '@playwright/test';
import axe from 'axe-core';

const baseURL = new URL(process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4100');
const output = path.resolve(process.env.AUDIT_OUTPUT_DIR ?? 'artifacts/phase0');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? chromium.executablePath();
const lighthouseRoutes = ['/', '/bench', '/teams/BOS'];
const axeRoutes = [...lighthouseRoutes, '/teams', '/method'];
const results = [];
const failures = [];
const summary = {
  startedAt: new Date().toISOString(),
  revision: process.env.GITHUB_SHA ?? process.env.AUDIT_REVISION ?? 'local working tree',
  baseURL: baseURL.href,
  environment: { node: process.version, platform: process.platform, loadAverage: os.loadavg() },
  thresholds: { mobilePerformance: 95, mobileAccessibility: 95, seriousOrCriticalAxe: 0 },
  results,
  failures,
};
await fs.mkdir(output, { recursive: true });
const slug = (route) => route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
const save = async (name, value) => fs.writeFile(path.join(output, name), typeof value === 'string' ? value : JSON.stringify(value, null, 2));
const record = async (entry) => {
  results.push(entry);
  console.log(JSON.stringify(entry));
  await save('summary.json', summary);
};
const recordError = async (kind, route, detail, error) => {
  const message = `${kind} ${route} ${JSON.stringify(detail)}: ${error.stack ?? error.message ?? String(error)}`;
  failures.push(message);
  await record({ tool: kind, route, ...detail, error: message });
};

// Axe runs sequentially before Lighthouse; no test or screenshot browser competes with timing.
let browser;
try {
  browser = await chromium.launch({ executablePath, headless: true });
  summary.environment.browser = browser.version();
  for (const width of [1440, 390]) {
    for (const route of axeRoutes) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', hasTouch: width < 640, isMobile: width < 640 });
      try {
        const page = await context.newPage();
        const pageErrors = [];
        page.on('pageerror', (error) => pageErrors.push(String(error)));
        const response = await page.goto(new URL(route, baseURL).href, { waitUntil: 'networkidle' });
        if (!response?.ok()) throw new Error(`HTTP ${response?.status() ?? 'no response'}`);
        await page.evaluate(async () => { await document.fonts.ready; });
        await page.addScriptTag({ content: axe.source });
        const report = await page.evaluate(async () => window.axe.run(document));
        await save(`axe-${slug(route)}-${width}.json`, report);
        const severe = report.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
        if (severe.length || pageErrors.length) failures.push(`axe ${route} at ${width}px: ${severe.length} serious/critical rules, ${pageErrors.length} page errors`);
        await record({ tool: 'axe', version: axe.version, route, width, violations: report.violations.map((v) => ({ id: v.id, impact: v.impact, nodeCount: v.nodes.length })), pageErrors });
      } catch (error) {
        await recordError('axe', route, { width }, error);
      } finally {
        await context.close();
      }
    }
  }
} catch (error) {
  await recordError('axe', '*', {}, error);
} finally {
  await browser?.close();
}

let chrome;
try {
  chrome = await chromeLauncher.launch({
    chromePath: executablePath,
    port: Number(process.env.AUDIT_DEBUG_PORT ?? 9225),
    maxConnectionRetries: 120,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  });
  for (const formFactor of ['mobile', 'desktop']) {
    for (const route of lighthouseRoutes) {
      try {
        const report = await lighthouse(new URL(route, baseURL).href, {
          port: chrome.port,
          output: ['json', 'html'],
          logLevel: 'error',
          onlyCategories: ['performance', 'accessibility'],
        }, formFactor === 'desktop' ? desktopConfig : undefined);
        if (!report?.lhr) throw new Error('Lighthouse returned no report');
        const { lhr } = report;
        await save(`lighthouse-${slug(route)}-${formFactor}.json`, report.report[0]);
        await save(`lighthouse-${slug(route)}-${formFactor}.html`, report.report[1]);
        if (lhr.runtimeError) throw new Error(`Lighthouse runtime error: ${JSON.stringify(lhr.runtimeError)}`);
        if (lhr.configSettings.formFactor !== formFactor) throw new Error(`Expected ${formFactor}; observed ${lhr.configSettings.formFactor}`);
        const performance = lhr.categories.performance.score;
        const accessibility = lhr.categories.accessibility.score;
        if (!Number.isFinite(performance) || !Number.isFinite(accessibility)) throw new Error('Missing Lighthouse category scores');
        if (formFactor === 'mobile' && (performance < 0.95 || accessibility < 0.95)) failures.push(`Lighthouse ${route} mobile: performance ${performance * 100}, accessibility ${accessibility * 100}; both require 95`);
        await record({
          tool: 'lighthouse', version: lhr.lighthouseVersion, route, formFactor,
          performance: performance * 100, accessibility: accessibility * 100,
          benchmarkIndex: lhr.environment.benchmarkIndex,
          metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map((id) => [id, lhr.audits[id].numericValue])),
          warnings: lhr.runWarnings,
        });
      } catch (error) {
        await recordError('lighthouse', route, { formFactor }, error);
      }
    }
  }
} catch (error) {
  await recordError('lighthouse', '*', {}, error);
} finally {
  await chrome?.kill();
}

// An incomplete run cannot pass vacuously.
for (const tool of ['axe', 'lighthouse']) {
  const completed = results.filter((result) => result.tool === tool && !result.error).length;
  const expected = tool === 'axe' ? axeRoutes.length * 2 : lighthouseRoutes.length * 2;
  if (completed !== expected) failures.push(`${tool}: expected ${expected} completed reports; found ${completed}`);
}
summary.finishedAt = new Date().toISOString();
summary.passed = failures.length === 0;
await save('summary.json', summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = ['## Phase 0 diagnostics', '', '| Route | Profile | Performance | Accessibility |', '|---|---|---:|---:|'];
  for (const row of results.filter((result) => result.tool === 'lighthouse' && !result.error)) lines.push(`| ${row.route} | ${row.formFactor} | ${row.performance} | ${row.accessibility} |`);
  lines.push('', summary.passed ? 'All Phase 0 diagnostic thresholds passed.' : 'Diagnostic thresholds failed:', ...failures.map((failure) => `- ${failure}`), '');
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, lines.join('\n'));
}
if (!summary.passed) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
