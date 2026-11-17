import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Employee pay" };

const RunEmployeePage = dynamic(() => import("@/src/components/hr/payroll/run-employee").then((m) => m.RunEmployeePage));

export default async function PayrollRunEmployeeRoute({ params }: { params: Promise<{ runId: string; employeeId: string }> }) {
  const { runId, employeeId } = await params;
  return <RunEmployeePage runId={decodeURIComponent(runId)} employeeId={decodeURIComponent(employeeId)} />;
}
