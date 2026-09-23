import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hire Tracker" };

const HireTrackerPage = dynamic(() =>
  import("@/src/components/hr/hire-tracker").then((m) => m.HireTrackerPage),
);

export default function HireTrackerRoute() {
  return <HireTrackerPage />;
}
