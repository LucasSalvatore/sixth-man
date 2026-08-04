import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Instrument_Sans, Newsreader, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

/**
 * Display: Newsreader — an editorial serif with moderate stroke contrast, so
 * its thins survive on near-black. Words only.
 */
const display = Newsreader({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

/** Body: Instrument Sans — quiet neo-grotesque, open apertures at 14–15px. Prose only. */
const body = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

/**
 * Numerals: Spline Sans Mono. Monospaced, so every digit, the em dash, the
 * U+2212 minus and the "$" share one advance width — alignment is a property of
 * the font metrics rather than of an optional `tnum` feature a subsetter can
 * drop. Every numeral on the page is set in this face.
 */
const numerals = Spline_Sans_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-num",
});

export const metadata: Metadata = {
  title: "deep-bench — Lucan Labs",
  description:
    "What each NBA bench is worth in wins, what those wins cost, which five a team should be starting, and where the minutes should go.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${numerals.variable}`}>
      <body className="min-h-screen antialiased" style={{ fontFamily: "var(--font-body)" }}>
        <a className="skip-link" href="#methodology">
          Skip to methodology
        </a>
        {children}
      </body>
    </html>
  );
}
