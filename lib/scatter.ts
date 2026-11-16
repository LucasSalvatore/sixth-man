import type { Team } from "@/lib/types";

/** Plot geometry only: positions never become displayed or modelled values. */
export function scatterGeometry(width: number, height: number) {
  const left = 48, right = width - 28, top = 30, bottom = height - 44;
  const x = (payroll: number) => left + ((payroll / 1_000_000 - 8) / 70) * (right - left);
  const y = (wins: number) => bottom - ((wins + 3) / 5.2) * (bottom - top);
  return { width, height, left, right, top, bottom, x, y };
}

export function fairPricePath(teams: Team[], g: ReturnType<typeof scatterGeometry>) {
  return [...teams].sort((a, b) => a.benchWinsAboveAvg - b.benchWinsAboveAvg)
    .map((team) => `${g.x(team.fairMarketBenchPayroll)},${g.y(team.benchWinsAboveAvg)}`).join(" ");
}

/** Separate code chips while leaving a leader anchored at the actual data point. */
export function scatterLabels(teams: Team[], g: ReturnType<typeof scatterGeometry>) {
  const placed: Array<{ x: number; y: number }> = [];
  return new Map([...teams].sort((a, b) => a.benchWinsAboveAvg - b.benchWinsAboveAvg || a.benchPayroll - b.benchPayroll).map((team) => {
    const px = g.x(team.benchPayroll), py = g.y(team.benchWinsAboveAvg);
    const candidates: Array<{ x: number; y: number; distance: number }> = [];
    for (let row = -8; row <= 8; row++) for (let col = -7; col <= 7; col++) {
      const x = Math.max(g.left + 22, Math.min(g.right - 22, px + col * 48));
      const y = Math.max(g.top + 16, Math.min(g.bottom - 16, py + row * 36));
      candidates.push({ x, y, distance: (x - px) ** 2 + (y - py) ** 2 });
    }
    candidates.sort((a, b) => a.distance - b.distance);
    const point = candidates.find((p) => placed.every((q) => Math.abs(p.x - q.x) >= 46 || Math.abs(p.y - q.y) >= 34)) ?? candidates[0];
    placed.push(point);
    return [team.team, point];
  }));
}
