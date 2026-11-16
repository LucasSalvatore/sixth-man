"use client";

import { useRef } from "react";
import { teamIdentity } from "@/lib/teamColors";
import { Num } from "@/components/ui";

/** One selector, serving both panels. Every team has a lineup and a minutes
 *  plan in the source, so every cell is a live destination. */
export function TeamRail({
  codes,
  selected,
  onSelect,
}: {
  codes: string[];
  selected: string;
  onSelect: (code: string) => void;
}) {
  const refs = useRef<Map<string, HTMLButtonElement>>(new Map());

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const grid = event.currentTarget.parentElement;
    const columns = grid ? getComputedStyle(grid).gridTemplateColumns.split(/\s+/).length : 1;
    const map: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: columns,
      ArrowUp: -columns,
    };
    const step = map[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const next = codes[(index + step + codes.length) % codes.length];
    onSelect(next);
    refs.current.get(next)?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Select a team"
      className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-10"
      style={{ borderTop: "1px solid var(--rule-1)", borderLeft: "1px solid var(--rule-1)" }}
    >
      {codes.map((code, index) => {
        const identity = teamIdentity(code);
        const isSelected = code === selected;
        return (
          <button
            key={code}
            ref={(node) => {
              if (node) refs.current.set(code, node);
              else refs.current.delete(code);
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(code)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="flex h-[34px] items-center justify-center"
            style={
              {
                "--team": identity.color,
                background: isSelected ? "var(--bg-hover)" : "transparent",
                borderRight: "1px solid var(--rule-1)",
                borderBottom: isSelected
                  ? "2px solid var(--team)"
                  : "1px solid var(--rule-1)",
              } as React.CSSProperties
            }
          >
            <Num
              className={`text-[15px] ${isSelected ? "team-text" : ""}`}
              style={{
                color: isSelected ? undefined : "var(--text-mid)",
              }}
            >
              {code}
            </Num>
          </button>
        );
      })}
    </div>
  );
}
