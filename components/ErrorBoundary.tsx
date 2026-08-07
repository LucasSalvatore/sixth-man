"use client";

import { Component, type ReactNode } from "react";

/**
 * Isolates one section's render failures from the rest of the page. Each
 * instance is independent — the scatter, the table, and the two
 * selection-driven panels are wrapped separately so one broken section
 * never blanks the others.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; label: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error(`[ErrorBoundary: ${this.props.label}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex min-h-[160px] items-center justify-center p-6 text-center"
          style={{ background: "var(--bg-panel)", border: "1px dashed var(--rule-2)" }}
        >
          <p className="max-w-[48ch] text-[14px] leading-[1.6]" style={{ color: "var(--text-mid)" }}>
            Something went wrong displaying this section.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
