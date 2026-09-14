"use client";

import { LIFECYCLE_STAGES } from "../data";
import type { LifecycleMetrics } from "../hooks";
import { StageNode } from "./stage-node";

/** One hex per stage, in stage order — the spine sweeps through all eight. */
const SPINE_GRADIENT =
  "linear-gradient(to bottom, #3b82f6, #10b981, #8b5cf6, #f43f5e, #f59e0b, #06b6d4, #6366f1, #64748b)";

export function JourneyPath({ metrics }: { metrics: LifecycleMetrics }) {
  return (
    <div className="relative">
      {/* The spine: a continuous gradient line running the length of the
          journey, visually saying "one connected path" rather than eight
          unrelated cards. */}
      <div
        className="absolute top-2 bottom-2 left-6 w-0.5 -translate-x-1/2 rounded-full md:left-1/2"
        style={{ backgroundImage: SPINE_GRADIENT }}
      />

      <div className="flex flex-col gap-8 md:gap-10">
        {LIFECYCLE_STAGES.map((stage, i) => (
          <StageNode
            key={stage.id}
            stage={stage}
            metric={metrics[stage.id]}
            side={i % 2 === 0 ? "left" : "right"}
          />
        ))}
      </div>
    </div>
  );
}
