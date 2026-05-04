"use client";

import { useEffect, useRef } from "react";

const GAP = 20;
const BASE_R = 1.2;
const MAX_R = 6;
const INFLUENCE = 110;
const LERP_SPEED = 0.12;

const ACCENT_COLORS: Array<[number, number, number]> = [
  [67, 97, 238],
  [78, 210, 81],
  [255, 139, 45],
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerpColor(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): string {
  const r = Math.round(from[0] + (to[0] - from[0]) * t);
  const g = Math.round(from[1] + (to[1] - from[1]) * t);
  const b = Math.round(from[2] + (to[2] - from[2]) * t);
  return `rgb(${r},${g},${b})`;
}

interface DotState {
  accentRgb: [number, number, number];
  currentT: number;
}

export function AnimatedDotBackground({ dotColor }: { dotColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const raf = useRef<number>(0);
  const colorRef = useRef(dotColor);
  const dotsRef = useRef<Map<string, DotState>>(new Map());

  useEffect(() => {
    colorRef.current = dotColor;
  }, [dotColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);

      const mx = mouse.current.x;
      const my = mouse.current.y;
      const baseRgb = hexToRgb(colorRef.current);
      const dots = dotsRef.current;

      for (let col = GAP / 2; col < w + GAP; col += GAP) {
        for (let row = GAP / 2; row < h + GAP; row += GAP) {
          const key = `${col},${row}`;

          if (!dots.has(key)) {
            dots.set(key, {
              accentRgb:
                ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
              currentT: 0,
            });
          }

          const dot = dots.get(key)!;

          const dist = Math.hypot(col - mx, row - my);
          const proximity = Math.max(0, 1 - dist / INFLUENCE);
          const targetT = proximity * proximity;

          dot.currentT += (targetT - dot.currentT) * LERP_SPEED;
          if (dot.currentT < 0.001) dot.currentT = 0;

          const r = BASE_R + (MAX_R - BASE_R) * targetT;
          const color =
            dot.currentT > 0
              ? lerpColor(baseRgb, dot.accentRgb, dot.currentT)
              : colorRef.current;

          ctx.fillStyle = color;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(col, row, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      raf.current = requestAnimationFrame(loop);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    raf.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
