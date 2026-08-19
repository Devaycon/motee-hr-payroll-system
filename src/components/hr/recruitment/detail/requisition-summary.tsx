"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import {
  EMPLOYMENT_TYPE_LABELS,
  HIRING_PRIORITY_LABELS,
  HIRING_PRIORITY_STYLES,
  POSTING_PLATFORMS,
  STAGE_TYPE_LABELS,
} from "@/src/data/recruitment-demo";
import type { JobRequisition } from "@/src/lib/types/recruitment";
import { cn } from "@/src/lib/utils";
import { AdvertDownloadMenu } from "./advert-download-menu";
import { pct, type RequisitionMetrics } from "./metrics";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

/**
 * §7.16 — the requisition at a glance, plus how its funnel is converting.
 *
 * The detail page went from the title straight to the stage tabs, so the band,
 * the channels it was posted to and its expiry were only visible by opening the
 * builder. Collapsed by default — the pipeline is what people come here for.
 */
export function RequisitionSummary({
  requisition,
  metrics,
}: {
  requisition: JobRequisition;
  metrics: RequisitionMetrics;
}) {
  const [open, setOpen] = useState(false);

  const platforms = (requisition.postingPlatforms ?? []).map(
    (id) => POSTING_PLATFORMS.find((p) => p.id === id)?.label ?? id,
  );
  const band =
    requisition.salaryMin || requisition.salaryMax
      ? `${formatMoneyLocale(requisition.salaryMin)} – ${formatMoneyLocale(requisition.salaryMax)}`
      : "";

  const headline = [
    `${metrics.activeTotal} active`,
    metrics.rejected > 0 ? `${metrics.rejected} rejected` : null,
    metrics.interviewed > 0 ? `${metrics.interviewed} interviewed` : null,
    metrics.timeToFill !== null ? `filled in ${metrics.timeToFill}d` : null,
    metrics.offerAcceptanceRate !== null
      ? `${pct(metrics.offerAcceptanceRate)} offers accepted`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Widest step anchors the bars, so the funnel shape is readable at a glance.
  const widest = Math.max(1, ...metrics.funnel.map((f) => f.reached));

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <Collapsible open={open} onOpenChange={setOpen}>
          {/* The download action is a sibling of the trigger, not a child —
              nesting a button inside a button is invalid and the two clicks
              would fight over the same press. */}
          <div className="flex items-start justify-between gap-2">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="group flex min-w-0 flex-1 items-start gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    Requisition detail &amp; pipeline health
                  </p>
                  <p className="text-xs text-muted-foreground">{headline}</p>
                </div>
              </button>
            </CollapsibleTrigger>
            <AdvertDownloadMenu requisition={requisition} />
          </div>

          <CollapsibleContent>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <Field label="Hiring manager" value={requisition.hiringManager} />
              <Field
                label="Employment type"
                value={EMPLOYMENT_TYPE_LABELS[requisition.employmentType]}
              />
              <Field label="Location" value={requisition.location} />
              <Field
                label="Priority"
                value={
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      HIRING_PRIORITY_STYLES[requisition.hiringPriority],
                    )}
                  >
                    {HIRING_PRIORITY_LABELS[requisition.hiringPriority]}
                  </Badge>
                }
              />
              <Field label="Salary band" value={band} />
              <Field
                label="Openings"
                value={`${requisition.openings} · ${metrics.funnel.at(-1)?.reached ?? 0} hired`}
              />
              <Field label="Target start" value={requisition.targetStartDate} />
              <Field
                label="Publishes"
                value={requisition.scheduledPublishAt || "Immediately"}
              />
              <Field
                label="Expires"
                value={
                  requisition.expiryDate
                    ? `${requisition.expiryDate}${requisition.autoCloseOnExpiry ? " · auto-closes" : ""}`
                    : ""
                }
              />
              <Field
                label="Interviews"
                value={`${metrics.interviewsScheduled} scheduled · ${metrics.interviewsCompleted} done`}
              />
              <Field
                label="Offers"
                value={`${metrics.offersSent} out · ${metrics.offersAccepted} accepted · ${metrics.offersDeclined} declined`}
              />
              <Field
                label="Avg. time in stage"
                value={
                  metrics.avgDaysInStage !== null
                    ? `${metrics.avgDaysInStage} days`
                    : ""
                }
              />
            </div>

            {platforms.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="text-[11px] text-muted-foreground">Posted to</p>
                <div className="flex flex-wrap gap-1">
                  {platforms.map((p) => (
                    <Badge key={p} variant="secondary" className="text-[10px]">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {requisition.requiredSkills.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="text-[11px] text-muted-foreground">
                  Required skills
                </p>
                <div className="flex flex-wrap gap-1">
                  {requisition.requiredSkills.map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 space-y-1.5">
              <p className="text-[11px] text-muted-foreground">
                Funnel — reached each stage
              </p>
              {metrics.funnel.map((step) => (
                <div key={step.stage} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">
                    {STAGE_TYPE_LABELS[step.stage]}
                  </span>
                  <div className="h-4 flex-1 overflow-hidden rounded-sm bg-muted">
                    <div
                      className="h-full rounded-sm bg-primary/70"
                      style={{ width: `${(step.reached / widest) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs text-foreground">
                    {step.reached}
                  </span>
                  <span className="w-12 shrink-0 text-right text-[11px] text-muted-foreground">
                    {step.conversion === null ? "" : pct(step.conversion)}
                  </span>
                </div>
              ))}
            </div>

            {requisition.jobDescription && (
              <div className="mt-4 space-y-1">
                <p className="text-[11px] text-muted-foreground">
                  Job description
                </p>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {requisition.jobDescription}
                </p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
