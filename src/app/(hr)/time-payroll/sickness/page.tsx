import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sickness & Absence" };

const SicknessRecordsPage = dynamic(() =>
  import("@/src/components/hr/sickness/records-page").then((m) => m.SicknessRecordsPage),
);

export default function SicknessRoute() {
  return <SicknessRecordsPage />;
}
