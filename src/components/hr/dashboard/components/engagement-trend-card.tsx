"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { EngagementTrend } from "@/src/components/hr/surveys/components/engagement-trend";

/**
 * The Surveys module's engagement chart, reused as-is: it already carries its
 * own department filter, headline score and a 3-card Highest/Lowest/Average
 * row, so the dashboard just needs to give it the card chrome every other
 * full-width widget has (`CustomisableGrid` renders widgets with none of
 * their own) and a drill-down into the module that owns the data.
 */
export function EngagementTrendCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <EngagementTrend />
      <Link
        href="/workspace/surveys"
        className="mt-auto inline-flex w-fit items-center gap-0.5 text-xs font-medium text-primary hover:underline"
      >
        View surveys
        <ChevronRight className="size-3.5" />
      </Link>
    </Card>
  );
}
