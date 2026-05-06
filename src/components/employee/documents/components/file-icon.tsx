import { cn } from "@/src/lib/utils";
import type { FileExt } from "../types";
import { EXT_CONFIG } from "../data";

export function FileIcon({
  ext,
  size = "md",
}: {
  ext: FileExt;
  size?: "sm" | "md" | "lg";
}) {
  const cfg = EXT_CONFIG[ext];
  const dims =
    size === "sm" ? "w-8 h-10" : size === "lg" ? "w-14 h-18" : "w-10 h-12";
  const labelSize =
    size === "sm" ? "text-[7px]" : size === "lg" ? "text-[11px]" : "text-[8px]";
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-sm overflow-hidden shrink-0",
        dims,
      )}
      style={{ background: `${cfg.bg}18`, border: `1.5px solid ${cfg.bg}40` }}
    >
      <div
        className="absolute top-0 right-0 w-0 h-0"
        style={{
          borderTop: `8px solid ${cfg.bg}30`,
          borderLeft: "8px solid transparent",
        }}
      />
      <div className="flex-1" />
      <div
        className="w-full py-0.5 flex items-center justify-center"
        style={{ background: cfg.bg }}
      >
        <span
          className={cn("font-bold tracking-wide", labelSize)}
          style={{ color: cfg.text }}
        >
          {cfg.label}
        </span>
      </div>
    </div>
  );
}
