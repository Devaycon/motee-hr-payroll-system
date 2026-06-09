"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";

export interface OverflowTabItem {
  value: string;
  label: React.ReactNode;
  /**
   * Optional notification count for this tab. When the tab is collapsed into
   * the "More" dropdown, its count is summed into a badge on the More button.
   */
  badgeCount?: number;
}

interface OverflowTabsListProps {
  tabs: OverflowTabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

const GAP = 4; // matches gap-1
const LIST_PADDING_X = 8; // p-1 → 4px each side
const MORE_RESERVE = 76; // space reserved for the "More" button + gap

/**
 * A tab bar that keeps triggers on a single line and collapses any that don't
 * fit into a "More ▾" dropdown. Must be rendered inside a controlled
 * `<Tabs value onValueChange>` (it renders real `TabsTrigger`s for the visible
 * tabs and routes dropdown selections through `onValueChange`).
 */
export function OverflowTabsList({
  tabs,
  value,
  onValueChange,
  className,
}: OverflowTabsListProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const measureRef = React.useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = React.useState(tabs.length);

  const recompute = React.useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const widths = Array.from(measure.children).map(
      (c) => (c as HTMLElement).getBoundingClientRect().width,
    );
    const available = container.clientWidth - LIST_PADDING_X;

    // Does everything fit without a "More" button?
    const totalAll = widths.reduce((sum, w, i) => sum + w + (i ? GAP : 0), 0);
    if (totalAll <= available) {
      setVisibleCount(tabs.length);
      return;
    }

    // Otherwise reserve room for the More button and fit what we can.
    const budget = available - MORE_RESERVE;
    let used = 0;
    let count = 0;
    for (let i = 0; i < widths.length; i += 1) {
      const next = used + widths[i] + (i ? GAP : 0);
      if (next > budget) break;
      used = next;
      count += 1;
    }
    setVisibleCount(Math.max(1, count));
  }, [tabs.length]);

  React.useLayoutEffect(() => {
    recompute();
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => recompute());
    ro.observe(container);
    return () => ro.disconnect();
  }, [recompute, tabs, value]);

  // Decide which tabs are visible, always keeping the active one in view.
  const { visible, overflow } = React.useMemo(() => {
    if (visibleCount >= tabs.length) {
      return { visible: tabs, overflow: [] as OverflowTabItem[] };
    }
    const keep = new Set(tabs.slice(0, visibleCount).map((t) => t.value));
    if (!keep.has(value)) {
      const lastVisible = tabs[visibleCount - 1]?.value;
      if (lastVisible) keep.delete(lastVisible);
      keep.add(value);
    }
    return {
      visible: tabs.filter((t) => keep.has(t.value)),
      overflow: tabs.filter((t) => !keep.has(t.value)),
    };
  }, [tabs, visibleCount, value]);

  // Sum the notification counts of the collapsed tabs so the "More" button can
  // surface that there are still items needing attention out of view.
  const overflowBadgeTotal = overflow.reduce(
    (sum, t) => sum + (t.badgeCount ?? 0),
    0,
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden measuring row — natural widths of every tab. */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 flex flex-nowrap gap-1 overflow-hidden opacity-0"
      >
        {tabs.map((t) => (
          <span
            key={t.value}
            className="inline-flex flex-none items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap"
          >
            {t.label}
          </span>
        ))}
      </div>

      <TabsList
        className={cn(
          "h-auto w-full flex-nowrap justify-start gap-1 overflow-hidden p-1",
          className,
        )}
      >
        {visible.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className="flex-none data-[state=active]:bg-[#ff8b2d]! data-[state=active]:text-white! data-[state=active]:shadow-none!"
          >
            {t.label}
          </TabsTrigger>
        ))}

        {overflow.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-auto inline-flex flex-none items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-colors hover:text-foreground"
              >
                More
                {overflowBadgeTotal > 0 && (
                  <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[#ff8b2d] text-[10px] font-semibold text-white">
                    {overflowBadgeTotal}
                  </span>
                )}
                <ChevronDown className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
              {overflow.map((t) => (
                <DropdownMenuItem
                  key={t.value}
                  onSelect={() => onValueChange(t.value)}
                  className={cn(t.value === value && "bg-accent font-medium")}
                >
                  {t.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TabsList>
    </div>
  );
}
