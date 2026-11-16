"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

/** useLayoutEffect on the client, useEffect on the server (avoids SSR warning). */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * True when the visitor has asked for reduced motion. Starts false so server
 * and first client render agree, then updates on mount and on preference change.
 * Every animation in the app collapses to its end state when this is true.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * Shared plot ref. Source marks begin visible and never depend on a viewport
 * observer; callers can still animate subsequent sorting and selection.
 */
export function useReveal<T extends HTMLElement>(
  { threshold = 0.15, rootMargin = "0px 0px -10% 0px" } = {},
): [RefObject<T | null>, boolean] {
  // Keep source content visible with JS off and before hydration. The caller
  // may still animate updates, but entering the viewport never gates data.
  void threshold;
  void rootMargin;
  const ref = useRef<T | null>(null);
  return [ref, true];
}

/**
 * FLIP. Records each `[data-flip-key]` child's box after every render and, when
 * `dependency` changes, animates it from where it used to be to where it is now.
 * Layout is never touched — only transforms — so sorting stays cheap.
 */
export function useFlip<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  dependency: unknown,
  {
    duration = 420,
    easing = "cubic-bezier(0.22, 1, 0.36, 1)",
    delay,
  }: {
    duration?: number;
    easing?: string;
    /** Per-key start offset — used to land the biggest movers last. */
    delay?: (key: string, distancePx: number) => number;
  } = {},
): void {
  const reduced = useReducedMotion();
  const previous = useRef<Map<string, DOMRect>>(new Map());

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const nodes = Array.from(
      container.querySelectorAll<HTMLElement>("[data-flip-key]"),
    );
    const next = new Map<string, DOMRect>();
    for (const node of nodes) {
      next.set(node.dataset.flipKey as string, node.getBoundingClientRect());
    }

    if (!reduced && previous.current.size > 0) {
      for (const node of nodes) {
        const key = node.dataset.flipKey as string;
        const before = previous.current.get(key);
        const after = next.get(key);
        if (!before || !after) continue;

        const dx = before.left - after.left;
        const dy = before.top - after.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;

        node.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: "translate(0, 0)" },
          ],
          {
            duration,
            easing,
            delay: delay ? delay(key, Math.abs(dy)) : 0,
            fill: "backwards",
          },
        );
      }
    }

    previous.current = next;
  }, [dependency, reduced, containerRef, duration, easing, delay]);
}



