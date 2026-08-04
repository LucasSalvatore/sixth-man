"use client";

import { useCountUp } from "@/lib/motion";
import { GhostSized, MicroLabel, Num } from "@/components/ui";

/**
 * Every hero figure is read straight from the JSON — there are no derived
 * figures here. Each previews a different section of the page.
 */
type Counter = {
  value: number;
  digits: number;
  signed: boolean;
  money: boolean;
  label: string;
  sub: string;
};

const COUNTERS: Counter[] = [
  {
    value: 1.96,
    digits: 2,
    signed: true,
    money: false,
    label: "Best bench, wins above average",
    sub: "Boston",
  },
  {
    value: 13469235,
    digits: 1,
    signed: false,
    money: true,
    label: "Lowest cost per bench win",
    sub: "Boston",
  },
  {
    value: 1.566,
    digits: 2,
    signed: true,
    money: false,
    label: "Largest lineup gain, in wins",
    sub: "Phoenix",
  },
  {
    value: 23.3,
    digits: 1,
    signed: true,
    money: false,
    label: "Largest minute increase",
    sub: "Thomas Bryant, Cleveland",
  },
];

function render(counter: Counter, current: number): string {
  if (counter.money) return `$${(current / 1_000_000).toFixed(counter.digits)}m`;
  const fixed = Math.abs(current).toFixed(counter.digits);
  if (!counter.signed) return fixed;
  return `${current < 0 ? "−" : "+"}${fixed}`;
}

function Counter({ counter, index }: { counter: Counter; index: number }) {
  const current = useCountUp(counter.value, { duration: 1100, delay: index * 90 });
  return (
    <div className="px-0 py-4 sm:px-6 sm:first:pl-0">
      <div
        className="text-[34px] leading-none sm:text-[56px]"
        style={{
          fontFamily: "var(--font-num)",
          letterSpacing: "-0.02em",
          color: "var(--text-hi)",
        }}
      >
        <GhostSized finalText={render(counter, counter.value)}>
          {render(counter, current)}
        </GhostSized>
      </div>
      <div className="mt-3 max-w-[24ch]">
        <MicroLabel>{counter.label}</MicroLabel>
      </div>
      <div className="mt-1 text-[12.5px]" style={{ color: "var(--text-lo)" }}>
        {counter.sub}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <header className="pt-14 sm:pt-20">
      <Num className="text-[12.5px]" style={{ letterSpacing: "0.08em", color: "var(--text-lo)" }}>
        deep-bench
      </Num>

      <h1
        className="mt-5 max-w-[16ch] text-[34px] leading-[1.10] sm:max-w-[20ch] sm:text-[60px] sm:leading-[1.06]"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 400,
          letterSpacing: "-0.015em",
          color: "var(--text-hi)",
        }}
      >
        What a bench is worth, and what it costs.
      </h1>

      <p className="mt-6 max-w-[62ch] text-[15.5px] leading-[1.55] sm:text-[17px]">
        Thirty NBA benches, priced. What each one adds in wins, what those wins cost, which five
        a team should actually be starting, and where the minutes should go.
      </p>

      <div
        className="mt-12 grid grid-cols-2 lg:grid-cols-4"
        style={{ borderTop: "1px solid var(--rule-1)" }}
      >
        {COUNTERS.map((counter, index) => (
          <div
            key={counter.label}
            style={{
              borderBottom: "1px solid var(--rule-1)",
              borderRight: "1px solid var(--rule-1)",
            }}
            className="[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:last-child]:border-r-0"
          >
            <Counter counter={counter} index={index} />
          </div>
        ))}
      </div>

      <div className="mt-10" style={{ borderTop: "1px solid var(--rule-2)" }} />
    </header>
  );
}
