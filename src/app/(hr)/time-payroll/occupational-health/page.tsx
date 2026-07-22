import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Occupational Health" };

const OccupationalHealthPage = dynamic(() =>
  import("@/src/components/hr/occupational-health").then(
    (m) => m.OccupationalHealthPage,
  ),
);

export default function OccupationalHealthRoute() {
  return <OccupationalHealthPage />;
}
