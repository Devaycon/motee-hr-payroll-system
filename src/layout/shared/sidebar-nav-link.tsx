"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * One navigation row, in both sidebar states.
 *
 * Collapsed, the icon *is* the target, so it gets a large square hit area and a
 * bigger glyph rather than a shrunken version of the expanded row — a 15px icon
 * floating in a rail is hard to hit and harder to read. The label moves to the
 * native tooltip and the accessible name, and a numeric badge becomes a dot,
 * since there's no room for the count.
 */
export function SidebarNavLink({
  href,
  label,
  icon: Icon,
  badge,
  active,
  collapsed,
  onClick,
  activeClassName = "bg-primary text-white border-l-4 border-[#4ED251]",
  /** Collapsed drops the left border — there's no row for it to edge. */
  activeCollapsedClassName = "bg-primary text-white",
  badgeClassName = "bg-primary text-white",
  badgeDotClassName = "bg-primary",
}: {
  href: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
  /** Each portal has its own accent — see the three sidebars. */
  activeClassName?: string;
  activeCollapsedClassName?: string;
  badgeClassName?: string;
  badgeDotClassName?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        title={collapsed ? label : undefined}
        aria-label={collapsed ? label : undefined}
        className={cn(
          "relative flex items-center transition-colors",
          collapsed
            ? "mx-auto h-12 w-12 justify-center rounded-xl"
            : "gap-2.5 px-3 py-4 text-sm",
          active
            ? collapsed
              ? activeCollapsedClassName
              : activeClassName
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        {Icon && (
          <Icon
            size={collapsed ? 22 : 15}
            strokeWidth={1.75}
            className="shrink-0"
          />
        )}

        {collapsed ? (
          badge !== undefined && (
            // The count doesn't fit, but "there is something here" still has to
            // survive the collapse.
            <span
              aria-hidden
              className={cn(
                "absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-sidebar",
                badgeDotClassName,
              )}
            />
          )
        ) : (
          <>
            <span className="flex-1 truncate">{label}</span>
            {badge !== undefined && (
              <span
                className={cn(
                  "flex items-center justify-center min-w-5 h-5 rounded-full text-[10px] font-semibold px-1",
                  badgeClassName,
                )}
              >
                {badge}
              </span>
            )}
          </>
        )}
      </Link>
    </li>
  );
}
