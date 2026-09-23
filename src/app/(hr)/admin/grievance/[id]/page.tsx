import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Case Detail" };

const CaseDetailPage = dynamic(() =>
  import("@/src/components/hr/grievance/detail").then(
    (m) => m.CaseDetailPage,
  ),
);

export default async function CaseDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CaseDetailPage caseId={id} />;
}
