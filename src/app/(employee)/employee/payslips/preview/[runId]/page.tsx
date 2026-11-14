import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payslip preview" };

const MyDraftPayslipPage = dynamic(() =>
  import("@/src/components/employee/payslips").then((m) => m.MyDraftPayslipPage),
);

export default async function MyDraftPayslipRoute({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <MyDraftPayslipPage runId={decodeURIComponent(runId)} />;
}
