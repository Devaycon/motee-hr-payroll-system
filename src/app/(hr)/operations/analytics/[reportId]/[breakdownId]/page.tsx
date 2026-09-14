import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Analytics Breakdown — Motee HR",
};

const ReportBreakdownPage = dynamic(() =>
  import("@/src/components/hr/analytics/report-breakdown").then(
    (m) => m.ReportBreakdownPage,
  ),
);

export default async function ReportBreakdownRoute({
  params,
}: {
  params: Promise<{ reportId: string; breakdownId: string }>;
}) {
  const { reportId, breakdownId } = await params;
  return <ReportBreakdownPage reportId={reportId} breakdownId={breakdownId} />;
}
