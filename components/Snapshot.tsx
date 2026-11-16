import type { DeepBenchMeta } from "@/lib/types";
import { SourceText } from "@/components/SourceText";

export function Snapshot({ meta }: { meta: DeepBenchMeta }) {
  return (
    <div data-snapshot className="mt-5 max-w-[80ch] text-[12px] leading-relaxed" style={{ color: "var(--text-lo)" }}>
      <p><span style={{ color: "var(--text-mid)" }}>Snapshot label: <SourceText text={meta.asOf} /></span> · <SourceText text={meta.seasonLabel} /></p>
      <p><SourceText text={meta.asOfNote} /></p>
      <p>Source: <SourceText text={meta.source} /></p>
    </div>
  );
}
