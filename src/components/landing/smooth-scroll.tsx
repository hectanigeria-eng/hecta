"use client";

import Lenis from "lenis";
import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let lenis: Lenis | undefined;
    let frame = 0;

    if (!reduceMotion) {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    }

    // Smooth-scroll for in-page anchor links (#section)
    const onClick = (event: MouseEvent) => {
      const anchor = (
        event.target as HTMLElement | null
      )?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      if (lenis) {
        lenis.scrollTo(target as HTMLElement);
      } else {
        target.scrollIntoView({ behavior: "auto", block: "start" });
      }
    };

    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, []);

  return null;
}
