import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shift Scheduling" };

const ShiftsPage = dynamic(() =>
  import("@/src/components/hr/shifts").then((m) => m.ShiftsPage),
);

export default function ShiftsRoute() {
  return <ShiftsPage />;
}
