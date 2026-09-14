import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Shifts" };

const MyShiftsPage = dynamic(() =>
  import("@/src/components/employee/shifts").then((m) => m.MyShiftsPage),
);

export default function MyShiftsRoute() {
  return <MyShiftsPage />;
}
