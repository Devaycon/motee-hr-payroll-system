"use client";

import { motion, useMotionValue, useMotionTemplate } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * App background: a faint, repeating watermark of the brand logo, with a soft
 * circular spotlight that reveals the original full-color logo tiles as the
 * cursor moves. Sits behind the page content (`z-10`), so the color reveal only
 * peeks through the empty spaces between opaque cards/panels.
 */
export function LogoPatternBackground({
  src = "/logo-tile.svg",
  tileW = 95,
}: {
  /** Padded tile (logo + transparent side-padding) used for the watermark. */
  src?: string;
  /** Rendered width of one tile in px; height follows the tile's aspect. */
  tileW?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Start off-screen so nothing is revealed until the mouse enters.
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      x.set(e.clientX - rect.left);
      y.set(e.clientY - rect.top);
    };
    const onLeave = () => {
      x.set(-9999);
      y.set(-9999);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [x, y]);

  const tiled = {
    backgroundImage: `url(${src})`,
    backgroundRepeat: "repeat" as const,
    backgroundSize: `${tileW}px auto`,
  };

  const spotlightMask = useMotionTemplate`radial-gradient(150px circle at ${x}px ${y}px, black 0%, black 35%, transparent 70%)`;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* 1. Very light orange-white surface (dark-mode fallback). */}
      <div className="absolute inset-0 bg-[#fff8f1] dark:bg-black" />

      {/* 2. Faint logo silhouettes — the watermark. `brightness-0` flattens the
            logo to black (light theme); `dark:invert` then flips it to white so it
            reads on the dark surface. Using filter utilities (not an inline
            `filter`) lets the two compose instead of the inline style winning.

            Dialled back ~35% from 0.035/0.06 — spanning the full page, it was
            competing with the cards and tables that should hold the eye
            (client feedback — background pattern). */}
      <div
        className="absolute inset-0 opacity-[0.022] brightness-0 dark:opacity-[0.04] dark:invert"
        style={tiled}
      />

      {/* 3. Full-color logo tiles, revealed only inside the cursor spotlight. */}
      <motion.div
        className="absolute inset-0"
        style={{
          ...tiled,
          maskImage: spotlightMask,
          WebkitMaskImage: spotlightMask,
        }}
      />
    </div>
  );
}
