import { Metadata } from "next";
import { WorkflowsHub } from "@/src/components/hr/workflows";

export const metadata: Metadata = {
  title: "Workflows — Motee HR",
  description: "",
};

export default function WorkflowsRoute() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Workflows</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Automated task assignment — define the tasks each action goes through,
          who does each one, and who reviews it.
        </p>
      </div>

      <WorkflowsHub />
    </div>
  );
}
