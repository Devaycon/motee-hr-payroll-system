"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type {
  WorkflowStatus,
  WorkflowTriggerEvent,
} from "@/src/lib/types/workflows";
import { isModuleWorkflow } from "../use-workflow-tab";
import { WorkflowCard } from "./workflow-card";

const WORKFLOWS_PATH = "/hr-action-center/workflows";

/** Live first, then drafts, then archived. */
const STATUS_ORDER: Record<WorkflowStatus, number> = {
  active: 0,
  draft: 1,
  archived: 2,
};

interface WorkflowTabProps {
  /** The lifecycle events this module starts workflows from. */
  events: readonly WorkflowTriggerEvent[];
}

/**
 * The read-only Workflow tab on a module: the tasks its process runs through,
 * who does each and who reviews it. Workflows are created and changed only in
 * the Workflows hub, so the cards carry no run, edit or archive controls.
 */
export function WorkflowTab({ events }: WorkflowTabProps) {
  const all = useAppSelector((s) => s.workflows.workflows);
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const departments = useAppSelector((s) => s.locale.data?.departments ?? []);

  const workflows = useMemo(
    () =>
      all
        .filter((w) => isModuleWorkflow(w, events))
        .sort(
          (a, b) =>
            STATUS_ORDER[a.status ?? "draft"] -
            STATUS_ORDER[b.status ?? "draft"],
        ),
    [all, events],
  );

  // Open the live workflow so the steps are visible without a click.
  const [openIds, setOpenIds] = useState<Set<string>>(
    () =>
      new Set(
        workflows.filter((w) => w.status === "active").map((w) => w.id),
      ),
  );

  function toggleOpen(id: string, open: boolean) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex max-w-2xl items-start gap-2.5">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            These workflows set the tasks this process runs through, who does
            each one and who reviews it. The <strong>active</strong> workflow
            is the one in use. They are read-only here — to create, edit or
            switch a workflow, go to <strong>Workflows</strong>.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5" asChild>
          <Link href={WORKFLOWS_PATH}>
            Manage workflows
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {workflows.map((wf) => (
          <WorkflowCard
            key={wf.id}
            workflow={wf}
            roles={roles}
            employees={employees}
            departments={departments}
            open={openIds.has(wf.id)}
            onOpenChange={(open) => toggleOpen(wf.id, open)}
          />
        ))}
      </div>
    </div>
  );
}
