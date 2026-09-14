import type { LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

const SIZE_CLASSES = {
  sm: "size-6 text-[11px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
  xl: "size-12 text-base",
} as const;

const ICON_SIZE_CLASSES = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
  xl: "size-7",
} as const;

/**
 * The lifecycle's stage mark: a solid blue rounded square, used everywhere a
 * stage is called out (chapter rail, journey wheel, legend) so it reads as
 * one consistent system rather than a plain colour dot. Shows the stage
 * number by default; pass `icon` to show that stage's icon instead (the
 * journey wheel's markers, where the icon carries more meaning at a glance).
 */
export function StageNumberBadge({
  step,
  icon: Icon,
  size = "sm",
  className,
}: {
  step: number;
  icon?: LucideIcon;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md bg-blue-600 font-bold leading-none text-white",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {Icon ? (
        // A touch heavier than Lucide's default 2px stroke — at badge size
        // the thin default reads as faint against the solid blue fill,
        // especially for line-heavy icons (TrendingUp, LogOut, FileStack).
        <Icon className={ICON_SIZE_CLASSES[size]} strokeWidth={2.5} />
      ) : (
        step
      )}
    </span>
  );
}
