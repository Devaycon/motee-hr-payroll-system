import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Reports & Analytics — Motee HR",
  description: "",
};

const ReportsPage = dynamic(() =>
  import("@/src/components/hr/reports").then((m) => m.ReportsPage),
);

export default function ReportsRoute() {
  return <ReportsPage />;
}
