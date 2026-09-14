import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Analytics — Motee HR",
};

const ReportAnalyticsDetailPage = dynamic(() =>
  import("@/src/components/hr/analytics/report-analytics-detail").then(
    (m) => m.ReportAnalyticsDetailPage,
  ),
);

export default async function ReportAnalyticsRoute({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  return <ReportAnalyticsDetailPage reportId={reportId} />;
}
