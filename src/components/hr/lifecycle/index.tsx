"use client";

import { useState } from "react";
import { Milestone, Users2, Cog, BookOpenText, Map } from "lucide-react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { Card } from "@/src/components/ui/card";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  LIFECYCLE_STAGES,
  ONGOING_MANAGEMENT_ITEMS,
  SUPPORTING_SERVICES_ITEMS,
} from "./data";
import { useLifecycleMetrics } from "./hooks";
import { JourneyPath } from "./components/journey-path";
import { LifecycleWheel } from "./components/lifecycle-wheel";
import { SupportingBand } from "./components/supporting-band";
import { StageStory } from "./components/stage-story";

export function LifecyclePage() {
  const [tab, setTab] = useState("journey");
  const metrics = useLifecycleMetrics();
  const totalOpen = Object.values(metrics).reduce(
    (sum, m) => sum + (m?.count ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-primary">
          <Milestone className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">
            Employee Lifecycle
          </span>
        </div>
        <h1 className="text-4xl font-semibold text-foreground">
          The complete employee journey
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Motee doesn&apos;t stop once you&apos;ve hired someone. A
          recruitment record becomes an employee record, which then drives
          onboarding, assets, learning, performance, engagement and
          eventually offboarding — {LIFECYCLE_STAGES.length} connected
          stages, one roadmap.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <PageTabsList
          tabs={[
            { value: "journey", label: "Journey Map" },
            { value: "guide", label: "Stage Guide" },
          ]}
        />

        <TabsContent value="guide" className="mt-6">
          {/*
            The Stage Story's chapter rail is `position: sticky`, which needs
            a real scrolling ancestor to stick against — Card's own
            `overflow-hidden` (for clipping rounded image corners elsewhere)
            blocks that, so this instance opts back into `overflow-visible`.
          */}
          <Card className="gap-8 overflow-visible p-6 sm:p-8">
            <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <BookOpenText className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  How each stage is designed to work
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  One continuous journey, {LIFECYCLE_STAGES.length} stages —
                  how the work is meant to flow, who owns what, and the detail
                  behind each one. Some of this is fully live in the linked
                  module today; some is still being built towards.
                </p>
              </div>
            </div>
            <StageStory onViewJourney={() => setTab("journey")} />
          </Card>
        </TabsContent>

        <TabsContent value="journey" className="mt-6">
          <Card className="gap-8 p-6 sm:p-8">
            <LifecycleWheel metrics={metrics} />

            <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-5">
              <Map className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Stage-by-stage detail
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {totalOpen > 0 ? (
                    <>
                      <span className="font-medium text-foreground">
                        {totalOpen} item{totalOpen === 1 ? "" : "s"}
                      </span>{" "}
                      {totalOpen === 1 ? "is" : "are"} moving through the
                      pipeline. Click any stage to open its workflow.
                    </>
                  ) : (
                    "Click any stage to open its workflow."
                  )}
                </p>
              </div>
            </div>

            <JourneyPath metrics={metrics} />

            <div className="flex flex-col gap-4">
              <SupportingBand
                title="Ongoing People Management"
                description="Support, enable and empower — running throughout the journey, not tied to a single stage."
                icon={Users2}
                items={ONGOING_MANAGEMENT_ITEMS}
                tone="muted"
              />
              <SupportingBand
                title="Services Supporting Everything"
                description="The foundation that keeps every stage connected, compliant and proactive."
                icon={Cog}
                items={SUPPORTING_SERVICES_ITEMS}
                tone="accent"
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
