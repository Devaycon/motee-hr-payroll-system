"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, MapPin, Users } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { cn } from "@/src/lib/utils";
import {
  EMPLOYMENT_TYPE_LABELS,
  REQUISITION_DISPLAY_STATUS,
  REQUISITION_DISPLAY_TONE_STYLES,
} from "@/src/data/recruitment-demo";
import type { RecruitmentStageType } from "@/src/lib/types/recruitment";
import { useRecruitment } from "../hooks";
import { getFlow, enabledStages } from "../flow";
import { StagePanel } from "./stage-panel";

/** Tab labels for the live three-stage pipeline. */
const TAB_LABELS: Record<RecruitmentStageType, string> = {
  applicants: "Applicant",
  shortlisted: "Shortlisted",
  interview: "Scheduled for Interview",
  hired: "Hired",
};

interface RequisitionDetailProps {
  requisitionId: string;
}

export function RequisitionDetail({ requisitionId }: RequisitionDetailProps) {
  const router = useRouter();
  const { country, loading, bucket } = useRecruitment();

  const requisition = bucket.requisitions.find((r) => r.id === requisitionId);

  const reqCandidates = useMemo(
    () =>
      bucket.candidates.filter((c) => c.requisitionId === requisitionId),
    [bucket.candidates, requisitionId],
  );

  const stages = useMemo(
    () => (requisition ? enabledStages(getFlow(requisition)) : []),
    [requisition],
  );

  const countByStage = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of reqCandidates) {
      if (c.status === "rejected") continue;
      m.set(c.stage, (m.get(c.stage) ?? 0) + 1);
    }
    return m;
  }, [reqCandidates]);

  if (loading) return null;

  if (!requisition) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-3 py-16 text-center">
        <p className="text-sm font-medium text-foreground">
          Requisition not found
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/talent/recruitment")}
        >
          Back to recruitment
        </Button>
      </div>
    );
  }

  const d = REQUISITION_DISPLAY_STATUS[requisition.status];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 pt-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push("/talent/recruitment")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="font-mono text-xs text-muted-foreground">
          {requisition.requisitionNumber ?? requisition.id}
        </span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold text-foreground">
              {requisition.positionTitle}
            </h1>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                REQUISITION_DISPLAY_TONE_STYLES[d.tone],
              )}
            >
              {d.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{requisition.department}</span>
            <span>· {EMPLOYMENT_TYPE_LABELS[requisition.employmentType]}</span>
            {requisition.location && requisition.location !== "—" && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {requisition.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3" /> {reqCandidates.filter((c) => c.status !== "rejected").length}{" "}
              applicants
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() =>
            router.push(`/talent/recruitment/new?req=${requisition.id}`)
          }
        >
          <Pencil className="w-4 h-4" />
          Edit
        </Button>
      </div>

      <Tabs defaultValue={stages[0] ?? "applicants"}>
        <PageTabsList
          tabs={stages.map((s) => ({
            value: s,
            label: `${TAB_LABELS[s]} (${countByStage.get(s) ?? 0})`,
          }))}
        />
        {stages.map((s) => (
          <TabsContent key={s} value={s} className="mt-5">
            <StagePanel
              country={country}
              requisition={requisition}
              stage={s}
              candidates={reqCandidates}
              interviews={bucket.interviews}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
