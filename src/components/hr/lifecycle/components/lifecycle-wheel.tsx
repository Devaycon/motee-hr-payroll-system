"use client";

import Link from "next/link";
import { ArrowUpRight, Bell, Database, ShieldCheck, Workflow } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { LIFECYCLE_STAGES, STAGE_COLOR_CLASSES } from "../data";
import type { LifecycleMetrics } from "../hooks";
import { StageNumberBadge } from "./stage-number";

const VALUE_PROPS = [
  {
    icon: Database,
    title: "One Connected Record",
    body: "Information follows the person through the lifecycle.",
  },
  {
    icon: Workflow,
    title: "Automated Workflows",
    body: "Approvals and hand-offs trigger the next action.",
  },
  {
    icon: Bell,
    title: "Proactive Action Centre",
    body: "Motee tells HR and managers what requires attention.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Auditability",
    body: "Requirements, evidence, documents and actions are tracked.",
  },
];

/**
 * The journey's hero: a colour-coded wheel with one numbered stop per stage,
 * live counts pulled from wherever HR is actually waiting on something, and
 * the value case either side. `JourneyPath` below still carries the detail —
 * this is the at-a-glance read.
 */
export function LifecycleWheel({ metrics }: { metrics: LifecycleMetrics }) {
  const liveStats = LIFECYCLE_STAGES.flatMap((stage) => {
    const metric = metrics[stage.id];
    return metric ? [{ stage, metric }] : [];
  });

  return (
    <div className="flex flex-col gap-8">
      {liveStats.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {liveStats.map(({ stage, metric }) => {
            const colors = STAGE_COLOR_CLASSES[stage.color];
            const Icon = stage.icon;
            return (
              <Link
                key={stage.id}
                href={stage.href}
                className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className={cn("flex size-7 items-center justify-center rounded-full", colors.bg, colors.text)}>
                  <Icon className="size-3.5" />
                </span>
                <span className="text-sm font-bold text-foreground tabular-nums">{metric.count}</span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">{metric.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            The employee lifecycle
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            One journey. Eight connected stages.
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground lg:mx-0">
            From workforce planning to offboarding, every stage connects to
            the next — carrying information forward, triggering the right
            actions and creating one continuous employee journey.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {VALUE_PROPS.map((v) => (
            <div key={v.title} className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-3">
              <v.icon className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-semibold text-foreground">{v.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{v.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LIFECYCLE_STAGES.map((stage) => {
          const colors = STAGE_COLOR_CLASSES[stage.color];
          const metric = metrics[stage.id];
          return (
            <Link
              key={stage.id}
              href={stage.href}
              className={cn(
                "group relative z-0 flex flex-col gap-2 overflow-hidden rounded-xl border border-transparent p-3.5 transition-colors hover:border-border",
                colors.bg,
              )}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-1 right-2 select-none text-4xl font-black leading-none text-foreground/6"
              >
                {String(stage.step).padStart(2, "0")}
              </span>

              <div className="relative z-10 flex flex-1 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <StageNumberBadge step={stage.step} icon={stage.icon} size="sm" className={colors.solid} />
                  <span className={cn("truncate text-xs font-semibold", colors.text)}>{stage.label}</span>
                </div>

                {metric && (
                  <p className="text-[11px] text-muted-foreground">{metric.label}</p>
                )}

                {stage.subLinks && (
                  <div className="flex flex-wrap gap-1">
                    {stage.subLinks.map((sub) => (
                      <span
                        key={sub.href + sub.label}
                        className={cn(
                          "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                          colors.bg,
                          colors.text,
                        )}
                      >
                        {sub.label}
                      </span>
                    ))}
                  </div>
                )}

                <span
                  className={cn(
                    "mt-auto inline-flex items-center gap-1 pt-1 text-[11px] font-semibold",
                    colors.text,
                  )}
                >
                  View details
                  <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
