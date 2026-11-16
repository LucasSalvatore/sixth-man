"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const DESTINATIONS = [
  { href: "/", label: "Today" },
  { href: "/bench", label: "Bench value" },
  { href: "/teams", label: "Teams" },
  { href: "/method", label: "Method" },
];

function isCurrent(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** One nav, two forms: a top bar from 640px up, a bottom tab bar below it. */
export function SiteNav() {
  const pathname = usePathname() ?? "/";

  return (
    <>
      <div
        className="sticky top-0 z-40 border-b"
        style={{ background: "color-mix(in oklab, var(--bg-base) 88%, transparent)", backdropFilter: "blur(10px)", borderColor: "var(--rule-1)" }}
      >
        <div className="mx-auto flex h-14 max-w-[1560px] items-center justify-between px-4 sm:px-8">
          <Link
            href="/"
            className="text-[19px]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-hi)" }}
          >
            deep<span style={{ color: "var(--gold)" }}>-</span>bench
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
            {DESTINATIONS.map(({ href, label }) => {
              const current = isCurrent(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className="px-3 py-2 text-[14px]"
                  style={{
                    fontWeight: 500,
                    color: current ? "var(--text-hi)" : "var(--text-lo)",
                    borderBottom: current ? "2px solid var(--gold)" : "2px solid transparent",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t sm:hidden"
        style={{ background: "var(--bg-panel)", borderColor: "var(--rule-2)" }}
      >
        {DESTINATIONS.map(({ href, label }) => {
          const current = isCurrent(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={current ? "page" : undefined}
              className="flex h-14 items-center justify-center text-[12.5px]"
              style={{
                fontWeight: 500,
                color: current ? "var(--text-hi)" : "var(--text-lo)",
                borderTop: current ? "2px solid var(--gold)" : "2px solid transparent",
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
