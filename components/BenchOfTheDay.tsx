"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Shows one of thirty pre-rendered team bands, chosen by the calendar day. The
 * server renders them all (so every figure is in the HTML) with the first one
 * visible; after mount the day's band is revealed instead. Nothing is computed
 * here — the day only picks which team's direct field reads are on show.
 */
export function BenchOfTheDay({ bands }: { bands: { code: string; node: ReactNode }[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const day = Math.floor(Date.now() / 86_400_000);
    setIndex(day % bands.length);
  }, [bands.length]);

  return (
    <div data-bench-of-the-day={bands[index]?.code}>
      {bands.map((band, i) => (
        <div key={band.code} hidden={i !== index}>
          {band.node}
        </div>
      ))}
    </div>
  );
}
