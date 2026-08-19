"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Star, GripVertical } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Switch } from "@/src/components/ui/switch";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { moveStage } from "@/src/lib/stores/recruitment-slice";
import { useCan } from "@/src/lib/permissions/use-can";
import {
  SOURCE_LABELS,
  STAGE_TYPE_LABELS,
  STAGE_TYPE_STYLES,
} from "@/src/data/recruitment-demo";
import type {
  Candidate,
  JobRequisition,
  RecruitmentStageType,
} from "@/src/lib/types/recruitment";
import { latestOffer } from "@/src/lib/types/recruitment";
import { cn } from "@/src/lib/utils";
import { getFlow, enabledStages } from "../flow";
import { canMoveTo, daysInStage } from "./advance";

interface PipelineBoardProps {
  country: string;
  requisition: JobRequisition;
  candidates: Candidate[];
  onOpenCandidate: (id: string) => void;
}

function CandidateCard({
  candidate,
  onOpen,
  draggable,
}: {
  candidate: Candidate;
  onOpen: () => void;
  draggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: candidate.id,
    disabled: !draggable,
  });
  const offer = latestOffer(candidate);
  const days = daysInStage(candidate);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group rounded-lg border border-border/60 bg-card p-2.5 shadow-xs transition-opacity",
        isDragging && "opacity-40",
        candidate.status === "rejected" && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <button
            type="button"
            className="mt-0.5 cursor-grab text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            aria-label={`Drag ${candidate.name}`}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-medium text-foreground">
            {candidate.name}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {SOURCE_LABELS[candidate.source] ?? candidate.source} · {days}d in
            stage
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {candidate.score != null && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                {candidate.score.toFixed(1)}
              </Badge>
            )}
            {offer && (
              <Badge variant="outline" className="text-[10px] capitalize">
                Offer {offer.status}
              </Badge>
            )}
            {candidate.status === "rejected" && (
              <Badge
                variant="outline"
                className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
              >
                Rejected
              </Badge>
            )}
            {candidate.onboardingInvitedAt && (
              <Badge
                variant="outline"
                className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400"
              >
                Invited
              </Badge>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

function StageColumn({
  stage,
  candidates,
  onOpenCandidate,
  canDrag,
}: {
  stage: RecruitmentStageType;
  candidates: Candidate[];
  onOpenCandidate: (id: string) => void;
  canDrag: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border border-border/60 bg-muted/30 p-2.5 transition-colors",
        isOver && "border-primary/60 bg-primary/5",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <Badge
          variant="outline"
          className={cn("text-[10px]", STAGE_TYPE_STYLES[stage])}
        >
          {STAGE_TYPE_LABELS[stage]}
        </Badge>
        <span className="text-xs text-muted-foreground">{candidates.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {candidates.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">
            Nobody here
          </p>
        ) : (
          candidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              draggable={canDrag && c.status === "active"}
              onOpen={() => onOpenCandidate(c.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * The pipeline as columns, with drag-to-advance.
 *
 * The stage tabs show one stage at a time, which is fine for working a queue
 * but useless for seeing where a hire is stuck. Moves go through the same
 * `canMoveTo` guard the table uses, so dragging can't route around the rule
 * that nobody reaches Hired without an accepted offer.
 */
export function PipelineBoard({
  country,
  requisition,
  candidates,
  onOpenCandidate,
}: PipelineBoardProps) {
  const dispatch = useAppDispatch();
  const canEdit = useCan("talent.recruitment", "edit");
  const [showRejected, setShowRejected] = useState(false);
  const [dragging, setDragging] = useState<Candidate | null>(null);

  const flow = useMemo(() => getFlow(requisition), [requisition]);
  const stages = useMemo(() => enabledStages(flow), [flow]);

  const sensors = useSensors(
    // A small threshold so clicking a card to open the drawer still works.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const byStage = useMemo(() => {
    const m = new Map<RecruitmentStageType, Candidate[]>(
      stages.map((s) => [s, []]),
    );
    for (const c of candidates) {
      if (!showRejected && c.status === "rejected") continue;
      m.get(c.stage)?.push(c);
    }
    return m;
  }, [candidates, stages, showRejected]);

  function handleDragStart(e: DragStartEvent) {
    setDragging(candidates.find((c) => c.id === e.active.id) ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setDragging(null);
    const candidate = candidates.find((c) => c.id === e.active.id);
    const to = e.over?.id as RecruitmentStageType | undefined;
    if (!candidate || !to) return;
    if (candidate.stage === to) return;

    const verdict = canMoveTo(candidate, to, flow);
    if (!verdict.ok) {
      toast.error(verdict.reason ?? "Can't move this candidate.");
      return;
    }
    dispatch(moveStage({ country, ids: [candidate.id], stage: to }));
    toast.success(`${candidate.name} moved to ${STAGE_TYPE_LABELS[to]}`);
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Switch
          checked={showRejected}
          onCheckedChange={(v) => setShowRejected(Boolean(v))}
        />
        Show rejected
      </label>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        <div className="flex gap-3 overflow-x-auto pb-3">
          {stages.map((s) => (
            <StageColumn
              key={s}
              stage={s}
              candidates={byStage.get(s) ?? []}
              canDrag={canEdit}
              onOpenCandidate={onOpenCandidate}
            />
          ))}
        </div>
        <DragOverlay>
          {dragging && (
            <div className="w-72 rotate-1">
              <CandidateCard
                candidate={dragging}
                draggable={false}
                onOpen={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
