"use client";

import { ResponsiveFunnel } from "@nivo/funnel";
import { Users2 } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ChartCard, NIVO_THEME, chartColor } from "@/src/components/shared/charts";
import { useRecruitment } from "@/src/components/hr/recruitment/hooks";
import { normaliseStage, type RecruitmentStageType } from "@/src/lib/types/recruitment";

/** The pipeline's fixed order — every candidate walks this line, so counts only ever fall as the stage advances. */
const STAGE_ORDER: RecruitmentStageType[] = [
  "applicants",
  "interview",
  "interviewed",
  "offer",
  "hired",
];

const STAGE_LABELS: Record<RecruitmentStageType, string> = {
  applicants: "Applied",
  interview: "Interviewing",
  interviewed: "Interviewed",
  offer: "Offer",
  hired: "Hired",
};

/** Active candidates by stage, across every open requisition. */
export function HiringFunnelCard() {
  const { loading, bucket } = useRecruitment();

  if (loading) {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }

  // Reached-this-stage-or-further, not "currently sitting in", so the funnel
  // narrows monotonically the way a hiring pipeline actually attrites.
  const stageIndex = new Map(STAGE_ORDER.map((s, i) => [s, i]));
  const funnelData = STAGE_ORDER.map((stage, i) => ({
    id: STAGE_LABELS[stage],
    label: STAGE_LABELS[stage],
    value: bucket.candidates.filter(
      (c) => (stageIndex.get(normaliseStage(c.stage)) ?? 0) >= i,
    ).length,
  }));

  const total = funnelData[0]?.value ?? 0;

  if (total === 0) {
    return (
      <ChartCard
        title="Hiring Pipeline"
        description="Active candidates by stage, across all open requisitions"
        icon={Users2}
        compact
        viewMoreHref="/talent/recruitment"
        className="h-full"
      >
        <p className="text-xs text-muted-foreground">
          No candidates in the pipeline yet.
        </p>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Hiring Pipeline"
      description="Active candidates by stage, across all open requisitions"
      icon={Users2}
      compact
      footer={`${total} applied · ${funnelData[funnelData.length - 1].value} hired`}
      viewMoreHref="/talent/recruitment"
      className="h-full"
    >
      <div style={{ height: 190 }}>
        <ResponsiveFunnel
          data={funnelData}
          direction="horizontal"
          margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
          shapeBlending={0.6}
          spacing={2}
          colors={(d) => chartColor(funnelData.findIndex((f) => f.id === d.id))}
          borderWidth={0}
          labelColor="var(--card)"
          theme={NIVO_THEME}
          motionConfig="gentle"
        />
      </div>
    </ChartCard>
  );
}
