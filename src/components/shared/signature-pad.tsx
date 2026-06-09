"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

interface SignaturePadProps {
  /** Called with a PNG data-URL after every stroke (null after Clear). */
  onChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
  className?: string;
  initialValue?: string | null;
}

/**
 * Lightweight canvas-based signature pad. Mouse + touch input.
 */
export function SignaturePad({
  onChange,
  width = 360,
  height = 140,
  className,
  initialValue,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasStrokes, setHasStrokes] = useState<boolean>(!!initialValue);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (initialValue) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = initialValue;
    }
  }, [initialValue]);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    drawing.current = true;
    last.current = getPoint(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function moveStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const point = getPoint(e);
    const from = last.current ?? point;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    last.current = point;
  }

  function endStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHasStrokes(true);
    onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    onChange(null);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onPointerDown={startStroke}
        onPointerMove={moveStroke}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={endStroke}
        className="rounded-md border border-border bg-white touch-none w-full max-w-full"
        style={{ aspectRatio: `${width} / ${height}` }}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {hasStrokes ? "Signed — clear to redo." : "Draw your signature above."}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={clear}
          disabled={!hasStrokes}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
