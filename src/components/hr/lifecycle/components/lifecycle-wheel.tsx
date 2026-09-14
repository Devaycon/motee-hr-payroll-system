"use client";

import Link from "next/link";
import { BarChart3, Database, ShieldCheck, Users, Workflow } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { LIFECYCLE_STAGES, STAGE_COLOR_CLASSES, STAGE_COLOR_HEX } from "../data";
import type { LifecycleMetrics } from "../hooks";
import { StageNumberBadge } from "./stage-number";

/** One 45° slice per stage, starting at 12 o'clock and running clockwise. */
const RING_GRADIENT = `conic-gradient(from 0deg, ${LIFECYCLE_STAGES.map(
  (s, i) => `${STAGE_COLOR_HEX[s.color]} ${i * 45}deg ${(i + 1) * 45}deg`,
).join(", ")})`;

/** Percent-based (x, y) for a stage's marker at the slice's midpoint angle. */
function stagePosition(index: number, radiusPct: number) {
  const angleDeg = index * 45 + 22.5;
  const rad = (angleDeg * Math.PI) / 180;
  return {
    left: `${50 + Math.sin(rad) * radiusPct}%`,
    top: `${50 - Math.cos(rad) * radiusPct}%`,
  };
}

const VALUE_PROPS = [
  {
    icon: Workflow,
    title: "Automated workflows",
    body: "Approvals and handoffs move on their own — nothing waits on a spreadsheet.",
  },
  {
    icon: Database,
    title: "One source of truth",
    body: "Every stage reads and writes the same employee record, start to finish.",
  },
  {
    icon: ShieldCheck,
    title: "Built-in compliance",
    body: "Checks, documents and policy sign-off are part of the flow, not an afterthought.",
  },
  {
    icon: BarChart3,
    title: "Actionable insights",
    body: "Every stage feeds Analytics, so a bottleneck shows up before it costs you.",
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

      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            The employee cycle
          </p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            One journey, eight connected stages
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground lg:mx-0">
            Nothing here is a dead end — every stage hands off cleanly into
            the next, so the record you start with is the one you finish
            with.
          </p>
        </div>

        {/*
          Fixed pixel dimensions, not `w-full`/`aspect-square`: every visible
          part of the wheel (ring, hub, stage markers) is `absolute`, so the
          box has no in-flow content of its own to size against. Inside the
          hero's `auto`-width grid track that leaves nothing for the browser
          to measure and the whole wheel collapses to ~0×0.
        */}
        <div className="relative order-1 mx-auto size-72 shrink-0 sm:size-80 lg:order-2 lg:size-96">
          <div
            aria-hidden
            className="absolute inset-0 rounded-full shadow-inner"
            style={{ background: RING_GRADIENT }}
          />
          <div className="absolute inset-[19%] flex flex-col items-center justify-center rounded-full border border-border bg-card text-center shadow-lg">
            <Users className="size-6 text-primary" />
            <p className="mt-1.5 text-sm font-bold text-foreground">Motee</p>
            <p className="text-[10px] text-muted-foreground">Employee Lifecycle</p>
          </div>
          {LIFECYCLE_STAGES.map((stage, i) => (
            <Link
              key={stage.id}
              href={stage.href}
              title={stage.label}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
              style={stagePosition(i, 38)}
            >
              <StageNumberBadge
                step={stage.step}
                icon={stage.icon}
                size="xl"
                className="rounded-full shadow-lg"
              />
            </Link>
          ))}
        </div>

        <div className="order-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
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
          return (
            <Link
              key={stage.id}
              href={stage.href}
              className={cn(
                "group flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-border",
                colors.bg,
              )}
            >
              <StageNumberBadge step={stage.step} size="sm" />
              <span className={cn("truncate text-xs font-semibold", colors.text)}>{stage.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
