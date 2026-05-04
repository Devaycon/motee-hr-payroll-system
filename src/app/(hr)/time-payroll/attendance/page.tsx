import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Attendance" };

const AttendancePage = dynamic(() =>
  import("@/src/components/hr/attendance").then((m) => m.AttendancePage),
);

export default function AttendanceRoute() {
  return <AttendancePage />;
}
