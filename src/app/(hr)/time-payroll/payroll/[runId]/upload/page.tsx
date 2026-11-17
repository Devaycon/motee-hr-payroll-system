import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Upload payroll figures" };

const ManualUploadPage = dynamic(() => import("@/src/components/hr/payroll/manual-upload").then((m) => m.ManualUploadPage));

export default async function PayrollUploadRoute({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <ManualUploadPage runId={decodeURIComponent(runId)} />;
}
