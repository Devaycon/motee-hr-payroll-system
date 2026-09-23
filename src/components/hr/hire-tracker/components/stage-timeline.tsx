"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Minus } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import type { StageFact } from "@/src/lib/hiring/resolve-stage";
import { cn } from "@/src/lib/utils";

/**
 * The six hiring stages as a numbered vertical timeline.
 *
 * A row on the tracker can only say which stage something is on; this says how
 * it got there and what is left — which is the question anyone asks the moment
 * they see the stage.
 */
export function StageTimeline({ facts }: { facts: StageFact[] }) {
  return (
    <ol className="relative">
      {facts.map((fact, i) => {
        const last = i === facts.length - 1;
        const done = fact.state === "done";
        const current = fact.state === "current";
        const skipped = fact.state === "skipped";

        return (
          <li key={fact.id} className="relative flex gap-4 pb-5 last:pb-0">
            {/* The spine, drawn behind the markers and stopped at the last one. */}
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px",
                  done ? "bg-[#FE8F44]" : "bg-border",
                )}
              />
            )}

            <span
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                done && "border-[#FE8F44] bg-[#FE8F44] text-white",
                current &&
                  "border-[#FE8F44] bg-background text-[#FE8F44] ring-4 ring-[#FE8F44]/20",
                skipped && "border-dashed border-border bg-transparent text-muted-foreground",
                !done && !current && !skipped &&
                  "border-border bg-muted text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="h-4 w-4" />
              ) : skipped ? (
                <Minus className="h-3.5 w-3.5" />
              ) : (
                fact.step
              )}
            </span>

            <Card
              className={cn(
                "flex-1 border-border/60",
                current && "border-[#FE8F44]/40 bg-[#FE8F44]/5",
                skipped && "border-dashed bg-transparent",
              )}
            >
              <CardContent className="flex flex-wrap items-start justify-between gap-2 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        !done && !current && "text-muted-foreground",
                      )}
                    >
                      {fact.label}
                    </p>
                    {current && (
                      <Badge
                        variant="outline"
                        className="border-[#FE8F44]/40 bg-[#FE8F44]/10 text-[10px] text-[#FE8F44]"
                      >
                        Current stage
                      </Badge>
                    )}
                    {skipped && (
                      <Badge
                        variant="outline"
                        className="border-dashed text-[10px] text-muted-foreground"
                      >
                        Skipped
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {fact.detail}
                  </p>
                  {fact.owner && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      With <span className="text-foreground">{fact.owner}</span>
                    </p>
                  )}
                </div>

                {fact.href && (
                  <Link
                    href={fact.href}
                    className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Open
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                )}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
