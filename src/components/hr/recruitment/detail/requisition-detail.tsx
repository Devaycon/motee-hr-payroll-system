"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  MapPin,
  Users,
  Columns3,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { useCan } from "@/src/lib/permissions/use-can";
import { cn } from "@/src/lib/utils";
import {
  EMPLOYMENT_TYPE_LABELS,
  REQUISITION_DISPLAY_STATUS,
  REQUISITION_DISPLAY_TONE_STYLES,
  STAGE_TYPE_LABELS,
} from "@/src/data/recruitment-demo";
import { useRecruitment } from "../hooks";
import { getFlow, enabledStages } from "../flow";
import { StagePanel } from "./stage-panel";
import { PipelineBoard } from "./pipeline-board";
import { CandidateDrawer } from "../components/candidate-drawer";
import { RequisitionSummary } from "./requisition-summary";
import { requisitionMetrics } from "./metrics";

interface RequisitionDetailProps {
  requisitionId: string;
}

export function RequisitionDetail({ requisitionId }: RequisitionDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { country, loading, bucket } = useRecruitment();
  const canEdit = useCan("talent.recruitment", "edit");

  const requisition = bucket.requisitions.find((r) => r.id === requisitionId);

  const reqCandidates = useMemo(
    () =>
      bucket.candidates.filter((c) => c.requisitionId === requisitionId),
    [bucket.candidates, requisitionId],
  );

  const reqInterviews = useMemo(
    () =>
      bucket.interviews.filter((iv) => iv.requisitionId === requisitionId),
    [bucket.interviews, requisitionId],
  );

  const stages = useMemo(
    () => (requisition ? enabledStages(getFlow(requisition)) : []),
    [requisition],
  );

  const metrics = useMemo(
    () =>
      requisition
        ? requisitionMetrics(
            requisition,
            reqCandidates,
            reqInterviews,
            getFlow(requisition),
          )
        : null,
    [requisition, reqCandidates, reqInterviews],
  );

  const countByStage = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of reqCandidates) {
      if (c.status === "rejected") continue;
      m.set(c.stage, (m.get(c.stage) ?? 0) + 1);
    }
    return m;
  }, [reqCandidates]);

  // View mode and the focused candidate live in the URL, so a recruiter can
  // paste "the board, on this person" to a colleague.
  const view = searchParams.get("view") === "board" ? "board" : "table";
  const focusCandidateId = searchParams.get("candidate");
  const activeTab = searchParams.get("tab") ?? stages[0] ?? "applicants";

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams],
  );

  const focusCandidate = useCallback(
    (id: string | null) => setParams({ candidate: id }),
    [setParams],
  );

  const boardCandidate = useMemo(
    () => reqCandidates.find((c) => c.id === focusCandidateId) ?? null,
    [reqCandidates, focusCandidateId],
  );

  if (loading) return null;

  if (!requisition || !metrics) {
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
            {/* Qualified with "Vacancy" so the badge says what it describes —
                next to a job title, a bare "Open" reads as ambiguous. */}
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 text-[10px]",
                REQUISITION_DISPLAY_TONE_STYLES[d.tone],
              )}
            >
              <span className="font-normal opacity-70">Vacancy status</span>
              <span className="opacity-40">·</span>
              {d.short}
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
              <Users className="w-3 h-3" /> {metrics.activeTotal} applicants
            </span>
          </p>
        </div>
        {canEdit && (
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
        )}
      </div>

      <RequisitionSummary requisition={requisition} metrics={metrics} />

      <div className="flex items-center justify-end gap-1.5">
        <Button
          variant={view === "table" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 gap-1.5 text-[11px]"
          onClick={() => setParams({ view: null })}
        >
          <TableIcon className="w-3.5 h-3.5" />
          Table
        </Button>
        <Button
          variant={view === "board" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 gap-1.5 text-[11px]"
          onClick={() => setParams({ view: "board" })}
        >
          <Columns3 className="w-3.5 h-3.5" />
          Board
        </Button>
      </div>

      {view === "board" ? (
        <PipelineBoard
          country={country}
          requisition={requisition}
          candidates={reqCandidates}
          onOpenCandidate={focusCandidate}
        />
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setParams({ tab: v, candidate: null })}
        >
          <PageTabsList
            tabs={stages.map((s) => ({
              value: s,
              label: `${STAGE_TYPE_LABELS[s]} (${countByStage.get(s) ?? 0})`,
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
                focusCandidateId={focusCandidateId}
                onFocusCandidate={focusCandidate}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* In table view the StagePanel owns the drawer; the board has no panel,
          so the same `?candidate=` param opens it from here. */}
      {view === "board" && boardCandidate && (
        <CandidateDrawer
          country={country}
          candidate={boardCandidate}
          requisition={requisition}
          interviews={bucket.interviews}
          onClose={() => focusCandidate(null)}
        />
      )}
    </div>
  );
}
