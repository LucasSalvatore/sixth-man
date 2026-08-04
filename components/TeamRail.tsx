"use client";

import { useRef } from "react";
import { teamIdentity } from "@/lib/teamColors";
import { Num } from "@/components/ui";

/**
 * One selector, serving both panels. The six teams with no lineup in the source
 * are marked but stay fully selectable — Panel 2 has complete data for all
 * thirty, so the empty state is a route rather than a dead end.
 */
export function TeamRail({
  codes,
  selected,
  onSelect,
  noLineup,
}: {
  codes: string[];
  selected: string;
  onSelect: (code: string) => void;
  noLineup: ReadonlySet<string>;
}) {
  const refs = useRef<Map<string, HTMLButtonElement>>(new Map());

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const map: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: 5,
      ArrowUp: -5,
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
        const missing = noLineup.has(code);
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
            aria-describedby={missing ? "no-lineup-hint" : undefined}
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
              className={`text-[13.5px] ${isSelected ? "team-text" : ""}`}
              style={{
                color: isSelected ? undefined : missing ? "var(--text-lo)" : "var(--text-mid)",
                textDecoration: missing ? "underline dotted" : "none",
                textUnderlineOffset: 3,
              }}
            >
              {code}
            </Num>
          </button>
        );
      })}
      <span id="no-lineup-hint" className="sr-only">
        No lineup in the source. Minutes plan available.
      </span>
    </div>
  );
}
