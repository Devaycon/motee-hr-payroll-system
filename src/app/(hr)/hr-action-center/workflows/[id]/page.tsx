"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { WorkflowBuilder } from "@/src/components/hr/workflows/workflow-builder";

export default function EditWorkflowRoute() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const workflow = useAppSelector((s) =>
    s.workflows.workflows.find((w) => w.id === params.id),
  );

  if (!workflow) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-3 py-16 text-center">
        <p className="text-sm font-medium text-foreground">
          Workflow not found
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/hr-action-center/workflows")}
        >
          Back to workflows
        </Button>
      </div>
    );
  }

  return (
    <WorkflowBuilder
      workflow={workflow}
      readOnly={workflow.kind === "system"}
    />
  );
}
