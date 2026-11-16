import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { deepBenchData, teamCodes, teams } from "@/lib/data";
import { formatMillions, formatSurplus, signed } from "@/lib/format";
import { teamIdentity } from "@/lib/teamColors";
import { loadGoogleFont } from "@/lib/og";

export const alt = "Team bench surplus, payroll, and modelled bench value — deep-bench";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";
export function generateStaticParams() { return teamCodes.map((code) => ({ code })); }

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const team = teams.find((row) => row.team === code);
  if (!team) notFound();
  const identity = teamIdentity(code);
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,%$+-−—'·–/;:";
  const font = await loadGoogleFont("JetBrains+Mono:wght@500", charset);
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", background: identity.color, color: "#050504", padding: "48px 56px", fontFamily: "Bench Mono" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20 }}><span>deep-bench · {team.team}</span><span>Lucan Labs</span></div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 34 }}>{identity.name}</div>
        <div style={{ display: "flex", fontSize: 104, letterSpacing: -6, marginTop: 8 }}>{formatSurplus(team.benchSurplusValue)}</div>
        <div style={{ display: "flex", fontSize: 20 }}>Bench surplus value · modelled relative to league pricing</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, borderTop: "1px solid #050504", paddingTop: 22 }}>
        <div style={{ display: "flex", gap: 40, fontSize: 20 }}><span>Payroll {formatMillions(team.benchPayroll)}</span><span>Bench WAA {signed(team.benchWinsAboveAvg, 2)}</span></div>
        <div style={{ display: "flex", fontSize: 15 }}>Snapshot label: {deepBenchData.meta.asOf}</div>
        <div style={{ display: "flex", fontSize: 12 }}>{deepBenchData.meta.asOfNote}</div>
      </div>
    </div>,
    { ...size, fonts: [{ name: "Bench Mono", data: font, weight: 500, style: "normal" }] },
  );
}
