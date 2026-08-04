import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * Three faces, one job each.
 *
 * Display — Fraunces. A high-contrast old-style serif with a genuinely
 * characterful axis (it carries optical-size and soft/wonk detailing), so the
 * argument reads as commissioned editorial rather than an enlarged UI sans.
 * Used only for the argument headline and section heads.
 */
const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

/** Body — Instrument Sans. A quiet, clean neo-grotesque for prose and labels. */
const body = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

/**
 * Numerals — JetBrains Mono. A true monospace, so every digit, the minus, the
 * dollar sign and the decimal share one advance width. Column alignment is a
 * property of the metrics, not of an optional feature a subsetter can drop.
 * Every number on the page is set in this face.
 */
const numerals = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-num",
});

export const metadata: Metadata = {
  title: "deep-bench — Lucan Labs",
  description:
    "NBA teams are bad at buying bench value: bench payroll explains about six percent of the variance in bench quality.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${numerals.variable}`}>
      <body className="min-h-screen antialiased" style={{ fontFamily: "var(--font-body)" }}>
        <noscript>
          <style>{`[data-reveal]{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        <a className="skip-link" href="#methodology">
          Skip to methodology
        </a>
        {children}
      </body>
    </html>
  );
}
