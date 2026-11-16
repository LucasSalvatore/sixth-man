import { test, expect } from "@playwright/test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DATA } from "./support/fixtures";

test("data guard accepts source and rejects missing chart, disclosure and metadata fields", () => {
  expect(execFileSync("node", ["scripts/check-data.mjs"], { encoding: "utf8" })).toContain("invariants hold");
  const folder = mkdtempSync(join(tmpdir(), "deep-bench-guard-"));
  try {
    const mutations: Array<(data: typeof DATA) => void> = [
      ...["r", "r2", "seasonLabel", "asOf", "asOfNote", "source", "leagueAvgBenchPayroll", "minutesCeiling"].map((field) =>
        (data: typeof DATA) => { delete (data.meta as unknown as Record<string, unknown>)[field]; }),
      (data) => { data.meta.r2 = 2; },
      (data) => { data.meta.disclosures = []; },
      ...["benchWinsAboveAvg", "fairMarketBenchPayroll", "benchPayroll"].map((field) =>
        (data: typeof DATA) => { for (const team of data.teams) delete (team as unknown as Record<string, unknown>)[field]; }),
    ];
    for (const mutate of mutations) {
      const data = structuredClone(DATA);
      mutate(data);
      const file = join(folder, "invalid.json");
      writeFileSync(file, JSON.stringify(data));
      const result = spawnSync("node", ["scripts/check-data.mjs", file], { encoding: "utf8" });
      expect(result.status, result.stdout).toBe(1);
    }
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
