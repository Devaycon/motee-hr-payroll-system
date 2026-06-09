import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Report — Motee HR",
};

const ReportDetailPage = dynamic(() =>
  import("@/src/components/hr/reports/report-detail").then(
    (m) => m.ReportDetailPage,
  ),
);

export default async function ReportDetailRoute({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  return <ReportDetailPage reportId={reportId} />;
}
