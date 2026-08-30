"use client";

import { TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { cn } from "@/src/lib/utils";
import { DASHBOARD_TABS } from "../widgets";

/**
 * The dashboard's own tab bar: equal segments filling the width, in a single
 * bordered strip.
 *
 * Not the shared `PageTabsList` — that is a compact pill row sized to its
 * labels, which is right for a page with many tabs but not for the dashboard's
 * primary navigation.
 *
 * Two things in the `TabsList`/`TabsTrigger` primitives have to be overridden
 * explicitly rather than just layered over:
 *
 *  - the list's height is set by `group-data-horizontal/tabs:h-9`, a
 *    group-scoped selector that outranks a plain `h-auto`, so a taller trigger
 *    overflows the strip instead of growing it. It has to be beaten with the
 *    same variant.
 *  - the active trigger's dark-mode fill is `bg-input/30`, which is
 *    translucent, so the page's background watermark shows through it. Both
 *    themes get an opaque fill here.
 */
const STRIP =
  "group-data-horizontal/tabs:h-auto w-full gap-0 rounded-xl border border-border bg-card p-0";

const SEGMENT = [
  // Beats the primitive's `h-[calc(100%-1px)]`, and the strip grows to match.
  "h-14 flex-1 rounded-none border-0 px-3 text-base font-medium shadow-none",
  "text-muted-foreground",
  // Primary fill, opaque in both themes, in both attribute spellings the
  // primitive uses.
  "data-[state=active]:bg-primary! data-active:bg-primary!",
  "dark:data-[state=active]:bg-primary! dark:data-active:bg-primary!",
  "data-[state=active]:text-primary-foreground! data-active:text-primary-foreground!",
  "dark:data-[state=active]:text-primary-foreground!",
  "data-[state=active]:font-semibold",
  "data-[state=active]:shadow-none! dark:data-[state=active]:border-transparent!",
  // The primitive draws an underline bar below the strip; the fill is the
  // active cue here, so it stays hidden.
  "after:hidden",
].join(" ");

export function DashboardTabsList() {
  return (
    <TabsList className={STRIP}>
      {DASHBOARD_TABS.map((tab, i) => (
        <TabsTrigger
          key={tab.key}
          value={tab.key}
          className={cn(
            SEGMENT,
            // A divider between segments rather than around each one, so the
            // strip reads as a single control.
            i > 0 && "border-l border-border",
            i === 0 && "rounded-l-xl",
            i === DASHBOARD_TABS.length - 1 && "rounded-r-xl",
          )}
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
