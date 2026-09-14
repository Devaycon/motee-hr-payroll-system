import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Analytics — Motee HR",
  description: "",
};

const AnalyticsPage = dynamic(() =>
  import("@/src/components/hr/analytics").then((m) => m.AnalyticsPage),
);

export default function AnalyticsRoute() {
  return <AnalyticsPage />;
}
