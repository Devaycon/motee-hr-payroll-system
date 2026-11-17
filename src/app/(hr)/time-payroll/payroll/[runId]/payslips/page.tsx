import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Run payslips" };

const RunPayslipsPage = dynamic(() => import("@/src/components/hr/payroll/run-payslips").then((m) => m.RunPayslipsPage));

export default async function RunPayslipsRoute({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <RunPayslipsPage runId={decodeURIComponent(runId)} />;
}
