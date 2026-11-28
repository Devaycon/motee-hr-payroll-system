import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Report Studio — Motee HR",
};

const ReportStudioPage = dynamic(() => import("@/src/components/hr/reports/studio").then((m) => m.ReportStudioPage));

export default function ReportStudioRoute() {
  return <ReportStudioPage />;
}
