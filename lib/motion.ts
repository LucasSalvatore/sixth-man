"use client";

import {
  useCallback,
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
 * Counts from 0 to `target` once, after `delay` ms. Returns the target
 * immediately when motion is reduced, so the number is never withheld.
 */
export function useCountUp(
  target: number,
  { duration = 1100, delay = 0, start = true }: {
    duration?: number;
    delay?: number;
    start?: boolean;
  } = {},
): number {
  const reduced = useReducedMotion();
  // Initialises at the target, so the server-rendered HTML already contains the
  // real figure. With JS off, or before hydration, the number is simply there;
  // the animation rewinds to 0 and plays forward only after mount.
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (!start) return;
    if (reduced) {
      setValue(target);
      return;
    }

    let frame = 0;
    let startedAt = 0;
    // easeOutExpo — fast commit, long settle. Reads as a figure landing.
    const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const tick = (now: number) => {
      if (!startedAt) startedAt = now;
      const elapsed = now - startedAt;
      const t = Math.min(1, elapsed / duration);
      setValue(target * ease(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    setValue(0);
    const timer = window.setTimeout(() => {
      frame = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [target, duration, delay, start, reduced]);

  return reduced ? target : value;
}

/**
 * Scroll reveal: the element scales and lifts into place as it enters the
 * viewport, once. Returns a ref and whether it has been revealed.
 */
export function useReveal<T extends HTMLElement>(
  { threshold = 0.15, rootMargin = "0px 0px -10% 0px" } = {},
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const reduced = useReducedMotion();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    const node = ref.current;
    if (!node) return;

    // No IntersectionObserver (or motion is reduced): show it, don't gate content.
    if (reduced || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced, revealed, threshold, rootMargin]);

  return [ref, revealed];
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



