import { ImageResponse } from "next/og";
import { teams, deepBenchData } from "@/lib/data";
import { teamIdentity } from "@/lib/teamColors";
import { formatMillions, signed } from "@/lib/format";

export const alt =
  "deep-bench — bench payroll explains about six percent of the variance in bench quality.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0a0a09";
const HI = "#f2f0ea";
const MID = "#c9c6bd";
const LO = "#97948b";
const GOLD = "#c8a44d";
const RULE = "#262520";

async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer> {
  // Built by hand rather than via URLSearchParams: Google's css2 endpoint
  // requires a literal "+" in `family` to mean a space (e.g. "Instrument+Sans"),
  // and URLSearchParams percent-encodes that "+" to %2B, which the endpoint
  // rejects with "400: Invalid selector". Only `text` needs encoding.
  const url = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/);
  if (!match) throw new Error(`Could not find a loadable font for ${family}`);
  const response = await fetch(match[1]);
  return response.arrayBuffer();
}

export default async function Image() {
  // Every figure below is read straight from the source JSON — nothing here
  // recomputes a payroll, a win value, or the headline percentage.
  const bos = teams.find((t) => t.team === "BOS")!;
  const por = teams.find((t) => t.team === "POR")!;
  const bosIdentity = teamIdentity("BOS");
  const porIdentity = teamIdentity("POR");

  // r2 is quoted verbatim inside meta.benchSurplusFormula ("r=0.25, r2=0.06");
  // parsed here rather than restated as a fresh literal.
  const r2Match = deepBenchData.meta.benchSurplusFormula.match(/r2=([\d.]+)/);
  const r2Pct = r2Match ? Math.round(parseFloat(r2Match[1]) * 100) : null;
  const headline = r2Pct !== null ? `~${r2Pct}%` : "barely predicts";

  const headlineText = `Bench payroll explains ${headline} of bench quality.`;

  // Full character coverage rather than exact-copy subsetting: subsetting to
  // only the literal strings on screen left glyphs (h, p, y, the comma) out of
  // the loaded font, and Satori silently fell back to a mismatched default for
  // them. This is also what keeps the image from breaking if the copy changes.
  const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const PUNCT = "0123456789 .,%$+−~—'";
  const CHARSET = LATIN + PUNCT;

  const [displayFont, bodyFont, numFont, numFontBold] = await Promise.all([
    loadGoogleFont("Fraunces:opsz,wght@9..144,600", CHARSET),
    loadGoogleFont("Instrument+Sans:wght@500", CHARSET),
    loadGoogleFont("JetBrains+Mono:wght@500", CHARSET),
    loadGoogleFont("JetBrains+Mono:wght@700", CHARSET),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          padding: "56px 64px",
          fontFamily: "Instrument Sans",
        }}
      >
        {/* Top: the small mark — the headline is the argument, not the name. */}
        <div style={{ display: "flex" }}>
          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: 2,
              color: GOLD,
            }}
          >
            deep-bench
          </span>
        </div>

        {/* Middle: the finding. */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              width: 32,
              height: 3,
              background: GOLD,
              marginBottom: 24,
            }}
          />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontFamily: "Fraunces",
              fontWeight: 600,
              fontSize: 60,
              lineHeight: 1.12,
              letterSpacing: -1,
              color: HI,
              maxWidth: 980,
            }}
          >
            {headlineText}
          </div>
        </div>

        {/* Bottom: the single most shareable fact — Boston vs. Portland. */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              borderTop: `1px solid ${RULE}`,
              paddingTop: 32,
              gap: 64,
            }}
          >
            <TeamStat
              tricode="BOS"
              name={bosIdentity.name}
              color={bosIdentity.color}
              payroll={formatMillions(bos.benchPayroll)}
              wins={signed(bos.benchWinsAboveAvg, 1)}
            />
            <div style={{ display: "flex", width: 1, background: RULE }} />
            <TeamStat
              tricode="POR"
              name={porIdentity.name}
              color={porIdentity.color}
              payroll={formatMillions(por.benchPayroll)}
              wins={signed(por.benchWinsAboveAvg, 1)}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 28,
            }}
          >
            <span
              style={{
                fontFamily: "Fraunces",
                fontWeight: 600,
                fontSize: 18,
                color: GOLD,
              }}
            >
              Lucan Labs
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: displayFont, weight: 600, style: "normal" },
        { name: "Instrument Sans", data: bodyFont, weight: 500, style: "normal" },
        { name: "JetBrains Mono", data: numFont, weight: 500, style: "normal" },
        { name: "JetBrains Mono", data: numFontBold, weight: 700, style: "normal" },
      ],
    },
  );
}

function TeamStat({
  tricode,
  name,
  color,
  payroll,
  wins,
}: {
  tricode: string;
  name: string;
  color: string;
  payroll: string;
  wins: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            width: 14,
            height: 14,
            borderRadius: 3,
            background: color,
          }}
        />
        <span
          style={{
            fontFamily: "JetBrains Mono",
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: 1,
            color: MID,
          }}
        >
          {tricode}
        </span>
        <span style={{ fontFamily: "Instrument Sans", fontSize: 16, color: LO }}>{name}</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          fontFamily: "JetBrains Mono",
          fontWeight: 700,
          fontSize: 44,
          color: HI,
        }}
      >
        <span>{payroll}</span>
        <span style={{ fontSize: 22, color: wins.startsWith("−") ? "#e0685e" : "#66d6a4" }}>
          {wins}
        </span>
      </div>
      <span
        style={{
          display: "flex",
          fontFamily: "Instrument Sans",
          fontSize: 15,
          color: LO,
          marginTop: 4,
        }}
      >
        bench payroll, wins above average
      </span>
    </div>
  );
}
