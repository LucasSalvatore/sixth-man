"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Team } from "@/lib/types";
import { formatMillions, formatSurplus, signed } from "@/lib/format";
import { isAchromatic, teamIdentity } from "@/lib/teamColors";
import { fairPricePath, scatterGeometry, scatterLabels } from "@/lib/scatter";
import { useSelectedTeam } from "@/components/SelectedTeamProvider";
import { ScatterOverview } from "@/components/ScatterOverview";
import { Num } from "@/components/ui";

const X_TICKS = [10, 30, 50, 70];
const Y_TICKS = [-3, -2, -1, 0, 1, 2];
const ANNOTATED = new Set(["BOS", "POR", "DEN", "SAS", "BKN"]);

export function BenchScatter({ teams, leagueAvgBenchPayroll }: { teams: Team[]; leagueAvgBenchPayroll: number }) {
  const router = useRouter();
  const { selected, setSelected } = useSelectedTeam();
  const plotRef = useRef<HTMLDivElement>(null);
  const pointRefs = useRef(new Map<string, SVGGElement>());
  const pointerType = useRef("mouse");
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(580);
  const [ready, setReady] = useState(false);
  const [wide, setWide] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  useEffect(() => { setPinned(selected); }, [selected]);

  useEffect(() => {
    const node = plotRef.current;
    if (!node) return;
    const query = window.matchMedia("(min-width: 640px)");
    const update = () => { const rect = node.getBoundingClientRect(); setWidth(rect.width - 2); setHeight(rect.height - 2); setWide(query.matches); setReady(true); };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    query.addEventListener("change", update);
    return () => { observer.disconnect(); query.removeEventListener("change", update); };
  }, []);

  const g = useMemo(() => scatterGeometry(width, height), [width, height]);
  const ordered = useMemo(() => [...teams].sort((a, b) => a.benchPayroll - b.benchPayroll), [teams]);
  const byWins = useMemo(() => [...teams].sort((a, b) => a.benchWinsAboveAvg - b.benchWinsAboveAvg), [teams]);
  const labels = useMemo(() => scatterLabels(teams, g), [teams, g]);
  const detail = teams.find((t) => t.team === (active ?? pinned ?? selected))!;

  function select(code: string) { setSelected(code); setPinned(code); setActive(code); }
  function keyboard(event: React.KeyboardEvent, code: string) {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(code); return; }
    const vertical = event.key === "ArrowUp" || event.key === "ArrowDown";
    const list = vertical ? byWins : ordered;
    let index = list.findIndex((t) => t.team === code);
    if (event.key === "ArrowRight" || event.key === "ArrowUp") index++;
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") index--;
    else if (event.key === "Home") index = 0;
    else if (event.key === "End") index = list.length - 1;
    else return;
    event.preventDefault();
    const next = list[Math.max(0, Math.min(list.length - 1, index))];
    pointRefs.current.get(next.team)?.focus();
  }

  function resolvePoint(event: React.MouseEvent<SVGGElement>, fallback: string) {
    if (wide) return fallback; // Code chips have distinct, non-overlapping hit targets.
    const svg = event.currentTarget.ownerSVGElement;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return fallback;
    const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    return [...teams].sort((a, b) =>
      (g.x(a.benchPayroll) - local.x) ** 2 + (g.y(a.benchWinsAboveAvg) - local.y) ** 2 -
      ((g.x(b.benchPayroll) - local.x) ** 2 + (g.y(b.benchWinsAboveAvg) - local.y) ** 2),
    )[0].team;
  }

  return (
    <div data-scatter style={{ containerType: "inline-size" }}>
      <p className="mb-3 text-[12px]" style={{ color: "var(--text-lo)" }}>Bench wins above average</p>
      <div ref={plotRef} className="scatter-frame relative w-full" style={{ background: "var(--bg-raised)", border: "1px solid var(--rule-2)" }}>
        {ready ? <svg viewBox={`0 0 ${width} ${height}`} className="block w-full" role="application" aria-label="Bench payroll against bench wins above average. Arrow keys move between teams; Enter or Space selects a team for the panels below." style={{ height: "100%" }}>
          {Y_TICKS.map((tick) => <g key={tick}>
            <line x1={g.left} x2={g.right} y1={g.y(tick)} y2={g.y(tick)} stroke={tick === 0 ? "var(--rule-4)" : "var(--rule-1)"} strokeDasharray={tick === 0 ? "6 5" : "2 4"} />
            <text x={g.left - 10} y={g.y(tick) + 4} textAnchor="end" fontSize={12} fill="var(--text-lo)" style={{ fontFamily: "var(--font-num)" }}>{signed(tick, 0)}</text>
          </g>)}
          <line x1={g.left} x2={g.right} y1={g.bottom} y2={g.bottom} stroke="var(--rule-4)" />
          {X_TICKS.map((tick) => <text key={tick} x={g.x(tick * 1_000_000)} y={g.bottom + 24} textAnchor="middle" fontSize={12} fill="var(--text-lo)" style={{ fontFamily: "var(--font-num)" }}>{formatMillions(tick * 1_000_000)}</text>)}
          <line data-payroll-average data-value={leagueAvgBenchPayroll} x1={g.x(leagueAvgBenchPayroll)} x2={g.x(leagueAvgBenchPayroll)} y1={g.top} y2={g.bottom} stroke="var(--gold)" strokeWidth={1.5} strokeDasharray="3 6" />
          <polyline data-fair-price points={fairPricePath(teams, g)} fill="none" stroke="var(--text-mid)" strokeWidth={2} />
          <line data-surplus-distance x1={g.x(detail.benchPayroll)} x2={g.x(detail.fairMarketBenchPayroll)} y1={g.y(detail.benchWinsAboveAvg)} y2={g.y(detail.benchWinsAboveAvg)} stroke="var(--text-hi)" strokeDasharray="3 3" strokeWidth={2} />
          {wide && ordered.map((team) => {
            const label = labels.get(team.team)!;
            return <g key={team.team} aria-hidden="true" pointerEvents="none">
              <line x1={g.x(team.benchPayroll)} y1={g.y(team.benchWinsAboveAvg)} x2={label.x} y2={label.y} stroke="var(--rule-4)" />
              <circle cx={g.x(team.benchPayroll)} cy={g.y(team.benchWinsAboveAvg)} r={3} fill={teamIdentity(team.team).color} />
            </g>;
          })}
          {ordered.map((team, index) => {
            const identity = teamIdentity(team.team);
            const anchor = wide ? labels.get(team.team)! : { x: g.x(team.benchPayroll), y: g.y(team.benchWinsAboveAvg) };
            const isSelected = selected === team.team;
            const hollow = isAchromatic(team.team);
            return <g key={team.team} data-team={team.team} data-selected={isSelected} data-scatter-point className="scatter-point" role="button"
              tabIndex={focused === team.team || (focused === null && index === 0) ? 0 : -1}
              aria-pressed={isSelected}
              aria-label={`${team.team} ${identity.name}. Bench payroll ${formatMillions(team.benchPayroll)}. Bench wins above average ${signed(team.benchWinsAboveAvg, 1)}. Surplus value ${formatSurplus(team.benchSurplusValue)}. ${isSelected ? "Selected — driving the lineup optimizer and minutes plan below." : "Enter or Space selects for the panels below."}`}
              ref={(node) => { if (node) pointRefs.current.set(team.team, node); else pointRefs.current.delete(team.team); }}
              style={{ cursor: "pointer", "--team": identity.color } as React.CSSProperties}
              onFocus={() => { setFocused(team.team); setActive(team.team); }}
              onBlur={() => setActive(null)}
              onPointerDown={(event) => { pointerType.current = event.pointerType; }}
              onPointerEnter={(event) => { if (event.pointerType === "mouse") setActive(team.team); }}
              onPointerLeave={() => setActive(null)}
              onKeyDown={(event) => keyboard(event, team.team)}
              onClick={(event) => {
                const code = event.detail === 0 ? team.team : resolvePoint(event, team.team);
                select(code);
                if (pointerType.current === "mouse" && event.detail > 0) router.push(`/teams/${code}`);
              }}>
              {wide ? <>
                <rect data-hit x={anchor.x - 21} y={anchor.y - 17} width={42} height={34} rx={2} fill={hollow ? "var(--bg-base)" : identity.color} stroke={identity.color} strokeWidth={hollow ? 2 : 1} />
                {isSelected && <rect data-selection-ring x={anchor.x - 24} y={anchor.y - 19} width={48} height={38} rx={3} fill="none" stroke="var(--text-hi)" strokeWidth={1.5} />}
                <text x={anchor.x} y={anchor.y + 4} textAnchor="middle" fontSize={12} fontWeight={600} fill={hollow ? "var(--text-hi)" : "var(--casing)"} pointerEvents="none" style={{ fontFamily: "var(--font-num)" }}>{team.team}</text>
              </> : <>
                <circle data-hit cx={anchor.x} cy={anchor.y} r={18} fill="transparent" />
                {isSelected && <circle data-selection-ring cx={anchor.x} cy={anchor.y} r={11} fill="none" stroke={identity.color} strokeWidth={1.5} />}
                <circle cx={anchor.x} cy={anchor.y} r={6} fill={hollow ? "var(--bg-base)" : identity.color} stroke={identity.color} strokeWidth={2} pointerEvents="none" />
              </>}
            </g>;
          })}
          {!wide && ordered.filter((team) => ANNOTATED.has(team.team)).map((team) => <text key={team.team} x={g.x(team.benchPayroll) + (team.team === "POR" ? -12 : 10)} y={g.y(team.benchWinsAboveAvg) + (team.team === "SAS" ? -14 : 19)} textAnchor={team.team === "POR" ? "end" : "start"} fontSize={12} fill="var(--text-hi)" pointerEvents="none" style={{ fontFamily: "var(--font-num)" }}>{team.team}</text>)}
        </svg> : <ScatterOverview teams={teams} leagueAvgBenchPayroll={leagueAvgBenchPayroll} />}
      </div>
      <p className="mt-3 text-center text-[12px]" style={{ color: "var(--text-lo)" }}>Bench payroll</p>
      <ul aria-label="Chart legend" className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[12px]" style={{ color: "var(--text-mid)" }}>
        <li><span className="mr-2 inline-block w-6 align-middle" style={{ borderTop: "2px solid var(--text-mid)" }} />Fair-price line · modelled</li>
        <li><span className="mr-2 inline-block w-6 align-middle" style={{ borderTop: "2px dashed var(--gold)" }} />Average payroll <Num>{formatMillions(leagueAvgBenchPayroll)}</Num></li>
        {ready && <li>Horizontal dotted distance: shown team’s surplus</li>}
      </ul>
      <div data-scatter-detail className="mt-5 grid gap-5 p-5 sm:grid-cols-[1fr_2fr]" style={{ background: "var(--bg-panel)", border: "1px solid var(--rule-2)" }}>
        <div>
          <h2 className="text-[20px]" style={{ color: "var(--text-hi)" }}>{teamIdentity(detail.team).name} <Num className="text-[12px]">{detail.team}</Num></h2>
          <Link prefetch={false} href={`/teams/${detail.team}`} className="mt-2 inline-flex min-h-8 items-center text-[15px] underline underline-offset-4">Open team card →</Link>
        </div>
        <dl className="grid grid-cols-3 gap-3">
          {[["Payroll", formatMillions(detail.benchPayroll)], ["Bench WAA", signed(detail.benchWinsAboveAvg, 1)], ["Surplus", formatSurplus(detail.benchSurplusValue)]].map(([label, value]) => <div key={label}>
            <dt className="text-[12px]" style={{ color: "var(--text-lo)" }}>{label}</dt><dd className="mt-1"><Num className="text-[15px]" style={{ color: "var(--text-hi)" }}>{value}</Num></dd>
          </div>)}
        </dl>
      </div>
      <p className="mt-3 max-w-[80ch] text-[12px] leading-relaxed" style={{ color: "var(--text-lo)" }}>{ready ? "Click a code to open its team card. On touch, tap to pin details and select the team below. With a keyboard, use arrow keys to move and Enter or Space to select. The small dot anchors each code to its exact payroll and bench value." : "This overview plots each team’s source payroll and bench value. Compare the full values in the team list below."}</p>
    </div>
  );
}
