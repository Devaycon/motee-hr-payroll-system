"use client";

import { motion, AnimatePresence, useMotionValue } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export function MoteeFollowingPointer({ logoSrc }: { logoSrc: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const inArea =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!inArea) {
        setVisible(false);
        return;
      }

      const topEl = document.elementFromPoint(e.clientX, e.clientY);
      if (!topEl || !(topEl instanceof HTMLElement)) {
        setVisible(false);
        return;
      }

      const TEXT_TAGS = new Set([
        "P",
        "SPAN",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "LABEL",
        "A",
        "LI",
        "TD",
        "TH",
        "CAPTION",
        "STRONG",
        "EM",
        "SMALL",
        "B",
        "I",
        "U",
        "S",
        "ABBR",
        "TIME",
        "SVG",
        "PATH",
        "CIRCLE",
        "RECT",
        "POLYLINE",
        "LINE",
      ]);

      if (TEXT_TAGS.has(topEl.tagName)) {
        setVisible(false);
        return;
      }

      // Walk up ancestor chain; if any element up to <main> has a real background, hide
      const mainContainer = container.parentElement;
      let current: HTMLElement | null = topEl;
      let hasBackground = false;
      while (
        current &&
        current !== mainContainer &&
        current !== document.body
      ) {
        const bg = getComputedStyle(current).backgroundColor;
        const transparent = bg === "transparent" || bg === "rgba(0, 0, 0, 0)";
        if (!transparent) {
          hasBackground = true;
          break;
        }
        current = current.parentElement;
      }

      if (!hasBackground) {
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
        setVisible(true);
      } else {
        setVisible(false);
      }
    },
    [x, y],
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-15"
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            className="pointer-events-none absolute flex items-center"
            style={{ top: y, left: x }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <div className="-translate-y-1/2 translate-x-3 flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-2.5 shadow-xl backdrop-blur-md">
              <Image
                src={logoSrc}
                alt=""
                width={24}
                height={24}
                className="object-contain"
              />
              <span className="uppercase hitespace-nowrap text-[14px] font-medium text-foreground">
                powered by motee solution
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
