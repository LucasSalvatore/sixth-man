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

/** The one-line finding, shared verbatim between the meta description and the
 *  Open Graph / Twitter Card descriptions so the three can't drift apart. */
const FINDING =
  "NBA teams are bad at buying bench value: bench payroll explains about six percent of the variance in bench quality.";

/**
 * Vercel injects this automatically for every deployment, pointing at the
 * project's production domain (custom domain if one is attached) — so social
 * previews and the canonical tag resolve correctly without a hardcoded guess.
 * Falls back to localhost for local dev, where absolute OG/canonical URLs
 * aren't meaningful anyway.
 */
const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "deep-bench — Lucan Labs",
  description: FINDING,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "deep-bench — NBA teams are bad at buying bench value",
    description: FINDING,
    url: "/",
    siteName: "deep-bench",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "deep-bench — NBA teams are bad at buying bench value",
    description: FINDING,
  },
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
