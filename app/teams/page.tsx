import { TeamGrid } from "@/components/TeamGrid";
import { teams } from "@/lib/data";

export const metadata = { title: "Teams — deep-bench", alternates: { canonical: "/teams" } };

export default function TeamsIndex() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
      <header className="pt-10 sm:pt-16">
        <h1
          className="text-display leading-[1] sm:text-display"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "-0.03em", color: "var(--text-hi)" }}
        >
          Thirty benches.
        </h1>
        <p className="mt-5 max-w-[60ch] text-[15px] leading-[1.6]">
          Pick a team for its bench value, the lineup the model would start, and where it would move
          the minutes. The figure on each tile is that team&apos;s bench surplus value.
        </p>
      </header>
      <div className="mt-12">
        <TeamGrid teams={teams} headingLevel={2} />
      </div>
    </div>
  );
}
