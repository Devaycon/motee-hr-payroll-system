import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Occupational Health Case" };

const OccupationalHealthCaseDetail = dynamic(() =>
  import("@/src/components/hr/occupational-health/case-detail").then(
    (m) => m.OccupationalHealthCaseDetail,
  ),
);

export default async function OccupationalHealthCaseRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OccupationalHealthCaseDetail caseId={id} />;
}
