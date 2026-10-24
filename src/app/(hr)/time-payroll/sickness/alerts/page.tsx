import dynamic from "next/dynamic";

const AlertsReportingPage = dynamic(() =>
  import("@/src/components/hr/sickness/alerts-reporting").then((m) => m.AlertsReportingPage),
);

export default function AlertsRoute() {
  return <AlertsReportingPage />;
}
