import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payroll run" };

const RunWorkspacePage = dynamic(() => import("@/src/components/hr/payroll/run-workspace").then((m) => m.RunWorkspacePage));

export default async function PayrollRunRoute({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <RunWorkspacePage runId={decodeURIComponent(runId)} />;
}
