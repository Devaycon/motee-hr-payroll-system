import { useAppSelector } from "@/src/lib/stores/hooks";
import type { PageTabItem } from "@/src/components/shared/page-tabs";
import type {
  Workflow,
  WorkflowTriggerEvent,
} from "@/src/lib/types/workflows";

/** The read-only tab a module shows for the workflows it kicks off. */
export const WORKFLOW_TAB_ITEM: PageTabItem = {
  value: "workflow",
  label: "Workflow",
};

/**
 * A workflow belongs to the module whose lifecycle event starts it — the
 * Recruitment workflow fires when a requisition is approved, Offboarding when
 * offboarding is initiated. Manual and fixed-date workflows aren't tied to an
 * event, so they live only in the Workflows hub.
 */
export function isModuleWorkflow(
  workflow: Workflow,
  events: readonly WorkflowTriggerEvent[],
): boolean {
  return (
    workflow.schedule?.kind === "relative" &&
    events.includes(workflow.schedule.event)
  );
}

/** Should this module show its read-only Workflow tab? */
export function useHasWorkflowTab(
  events: readonly WorkflowTriggerEvent[],
): boolean {
  return useAppSelector((s) =>
    s.workflows.workflows.some((w) => isModuleWorkflow(w, events)),
  );
}
