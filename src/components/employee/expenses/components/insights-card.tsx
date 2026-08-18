"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import type { Insight } from "../insights";

const TONE_ICON = {
  warning: AlertTriangle,
  positive: CheckCircle2,
  neutral: Info,
} as const;

const TONE_STYLE = {
  warning: "text-amber-600 dark:text-amber-400",
  positive: "text-emerald-600 dark:text-emerald-400",
  neutral: "text-muted-foreground",
} as const;

interface InsightsCardProps {
  insights: Insight[];
}

/**
 * §8.5 — the Expense Insights summary.
 *
 * Deliberately headed "Expense Insights" and not "AI Insights": everything
 * here is computed from the claims on screen, and labelling it as generated
 * would misrepresent where the numbers come from.
 */
export function InsightsCard({ insights }: InsightsCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (dismissed || insights.length === 0) return null;

  const visible = showAll ? insights : insights.slice(0, 3);

  return (
    <Card className="border-border/60">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-[#7F77DD]" aria-hidden />
          <p className="text-sm font-semibold text-foreground">
            Expense Insights
          </p>
          <span className="text-[11px] text-muted-foreground">
            From your claim history
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-6 w-6 text-muted-foreground"
            aria-label="Dismiss insights"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <ul className="space-y-2">
          {visible.map((insight) => {
            const Icon = TONE_ICON[insight.tone];
            return (
              <li key={insight.id} className="flex items-start gap-2">
                <Icon
                  className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", TONE_STYLE[insight.tone])}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    {insight.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {insight.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {insights.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1 text-[11px] text-muted-foreground"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll
              ? "Show fewer"
              : `Show ${insights.length - 3} more`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
