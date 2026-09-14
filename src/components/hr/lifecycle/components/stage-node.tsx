"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { STAGE_COLOR_CLASSES, type LifecycleStage } from "../data";
import type { LifecycleMetric } from "../hooks";

interface StageNodeProps {
  stage: LifecycleStage;
  metric?: LifecycleMetric;
  /** Which side of the spine the card sits on at desktop width. */
  side: "left" | "right";
}

export function StageNode({ stage, metric, side }: StageNodeProps) {
  const colors = STAGE_COLOR_CLASSES[stage.color];
  const Icon = stage.icon;

  return (
    <div className="relative flex items-center">
      {/* The waypoint marker, pinned to the centre spine on desktop. */}
      <div
        className={cn(
          "absolute left-6 z-10 flex size-12 shrink-0 items-center justify-center rounded-full text-white shadow-md ring-4 ring-background md:left-1/2 md:-translate-x-1/2",
          colors.solid,
        )}
      >
        <Icon className="size-5" />
      </div>

      {/* The card — full width and offset from the marker on mobile;
          alternates sides of the spine from md up. */}
      <div
        className={cn(
          "w-full pl-20 md:w-1/2 md:pl-0",
          side === "left"
            ? "md:pr-14 md:text-right"
            : "md:ml-auto md:pl-14",
        )}
      >
        <Link
          href={stage.href}
          className={cn(
            "group block rounded-2xl border border-border bg-card p-5 shadow-sm ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-lg",
            colors.ring,
            "hover:ring-2",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide",
              colors.text,
              side === "left" ? "md:justify-end" : "md:justify-start",
            )}
          >
            <span>Stage {stage.step}</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-muted-foreground normal-case font-normal italic">
              {stage.question}
            </span>
          </div>

          <div
            className={cn(
              "mt-1.5 flex items-center gap-2",
              side === "left" ? "md:flex-row-reverse" : "",
            )}
          >
            <h3 className="text-lg font-semibold text-foreground">
              {stage.label}
            </h3>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <p className="mt-1.5 text-sm text-muted-foreground">
            {stage.description}
          </p>

          {metric && (
            <div
              className={cn(
                "mt-3 flex",
                side === "left" ? "md:justify-end" : "md:justify-start",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                  colors.bg,
                  colors.text,
                )}
              >
                {metric.label}
              </span>
            </div>
          )}

          {stage.subLinks && (
            <div
              className={cn(
                "mt-3 flex flex-wrap gap-1.5",
                side === "left" ? "md:justify-end" : "md:justify-start",
              )}
            >
              {stage.subLinks.map((sub) => {
                const SubIcon = sub.icon;
                return (
                  <span
                    key={sub.href + sub.label}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                      colors.bg,
                      colors.text,
                    )}
                  >
                    <SubIcon className="size-3" />
                    {sub.label}
                  </span>
                );
              })}
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
