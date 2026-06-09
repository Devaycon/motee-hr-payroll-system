import { Metadata } from "next";
import { WorkflowBuilder } from "@/src/components/hr/workflows/workflow-builder";

export const metadata: Metadata = {
  title: "Create Workflow — Motee HR",
  description: "",
};

export default function NewWorkflowRoute() {
  return <WorkflowBuilder />;
}
