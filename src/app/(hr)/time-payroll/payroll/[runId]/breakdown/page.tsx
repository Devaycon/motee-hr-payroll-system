import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payroll breakdown" };

const RunBreakdownPage = dynamic(() => import("@/src/components/hr/payroll/run-breakdown").then((m) => m.RunBreakdownPage));

export default async function RunBreakdownRoute({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <RunBreakdownPage runId={decodeURIComponent(runId)} />;
}
