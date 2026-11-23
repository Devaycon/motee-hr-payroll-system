import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Variance investigation" };

const InvestigationDetailPage = dynamic(() => import("@/src/components/hr/payroll/investigation-detail").then((m) => m.InvestigationDetailPage));

export default async function InvestigationRoute({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return <InvestigationDetailPage caseId={decodeURIComponent(caseId)} />;
}
