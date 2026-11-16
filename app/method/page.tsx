import { Methodology } from "@/components/Methodology";
import { deepBenchData } from "@/lib/data";

export const metadata = { title: "How this was built — deep-bench", alternates: { canonical: "/method" } };

export default function MethodPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
      <header className="pt-10 sm:pt-16">
        <h1
          id="methodology"
          className="max-w-[18ch] text-[40px] leading-[1] sm:text-[68px]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "-0.03em", color: "var(--text-hi)" }}
        >
          How this was built.
        </h1>
        <p className="mt-5 max-w-[60ch] text-[16px] leading-[1.6]">
          What the model can see, and the seven places it cannot.
        </p>
      </header>
      <div className="mt-12">
        <Methodology meta={deepBenchData.meta} />
      </div>
    </div>
  );
}
