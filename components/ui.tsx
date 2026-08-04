"use client";

import type { CSSProperties, ReactNode } from "react";
import { useReveal } from "@/lib/motion";

/** The one gold tick above each section head. Gold's only structural job. */
export function SectionHead({
  id,
  title,
  deck,
}: {
  id: string;
  title: string;
  deck: string;
}) {
  return (
    <div className="mb-8">
      <div aria-hidden="true" style={{ width: 28, height: 2, background: "var(--gold)" }} />
      <h2
        id={id}
        className="mt-4 text-[24px] leading-[1.18] sm:text-[30px] sm:leading-[1.15]"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: "var(--text-hi)",
        }}
      >
        {title}
      </h2>
      <p className="mt-2 max-w-[62ch] text-[14.5px] leading-[1.6] sm:text-[15px]">{deck}</p>
    </div>
  );
}

export function MicroLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span
      className="text-[11.5px] leading-[1.3]"
      style={{ fontWeight: 500, letterSpacing: "0.055em", color: "var(--text-lo)", ...style }}
    >
      {children}
    </span>
  );
}

/** Numerals are always the mono face — the site's typographic signature. */
export function Num({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={className} style={{ fontFamily: "var(--font-num)", ...style }}>
      {children}
    </span>
  );
}

/**
 * Currency symbols and unit suffixes drop back so the digits alone form the
 * column silhouette: "$26.4m" reads as 26.4 with quiet furniture.
 */
export function Money({ text, className = "" }: { text: string; className?: string }) {
  if (text === "—") {
    return (
      <Num className={className} style={{ color: "var(--text-lo)" }}>
        —
      </Num>
    );
  }
  const body = text.startsWith("$") ? text.slice(1, -1) : text;
  return (
    <Num className={className}>
      <span style={{ fontSize: "0.55em", color: "var(--text-mid)" }}>$</span>
      {body}
      <span style={{ fontSize: "0.55em", color: "var(--text-mid)" }}>m</span>
    </Num>
  );
}

/**
 * Scroll reveal. Applied to exactly three elements — the scatter plate and the
 * two panel bodies — never to a <section>, and never to anything containing a
 * position:sticky descendant, because a transformed ancestor becomes the
 * containing block for sticky and would break the table's sticky header.
 */
export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [ref, revealed] = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={className}
      // data-reveal is the hook a <noscript> rule uses to force this visible;
      // without it, a JS-less visitor would get a permanently opacity-0 panel.
      data-reveal=""
      style={{
        opacity: revealed ? 1 : 0,
        // No transform in the resting state at all — not even scale(1).
        ...(revealed ? {} : { transform: "translateY(18px) scale(0.965)" }),
        transition: "opacity 520ms var(--ease-out), transform 520ms var(--ease-out)",
      }}
    >
      {children}
    </div>
  );
}

/**
 * A counting number changes string length mid-animation. An invisible copy of
 * the final string, with digits zeroed, holds the cell width so nothing reflows.
 */
export function GhostSized({
  finalText,
  children,
}: {
  finalText: string;
  children: ReactNode;
}) {
  return (
    <span className="relative inline-block">
      <span aria-hidden="true" style={{ visibility: "hidden" }}>
        {finalText.replace(/\d/g, "0")}
      </span>
      <span className="absolute inset-0 whitespace-nowrap">{children}</span>
    </span>
  );
}
