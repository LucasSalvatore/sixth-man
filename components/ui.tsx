import type { CSSProperties, ReactNode } from "react";

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
        className="mt-4 text-[34px] leading-[1.18] sm:text-[34px] sm:leading-[1.15]"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: "var(--text-hi)",
        }}
      >
        {title}
      </h2>
      <p className="mt-2 max-w-[62ch] text-[15px] leading-[1.6] sm:text-[15px]">{deck}</p>
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
      className="text-[12px] leading-[1.3]"
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
      <span style={{ fontSize: "var(--type-micro)", color: "var(--text-mid)" }}>$</span>
      {body}
      <span style={{ fontSize: "var(--type-micro)", color: "var(--text-mid)" }}>m</span>
    </Num>
  );
}

/** A server-compatible wrapper; content never waits for client hydration. */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={className} data-reveal="">{children}</div>;
}
