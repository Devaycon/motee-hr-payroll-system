import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "My Attendance — Motee HR",
  description: "",
};

const MyAttendancePage = dynamic(() =>
  import("@/src/components/employee/attendance").then(
    (m) => m.MyAttendancePage,
  ),
);

export default function HrMyAttendanceRoute() {
  return <MyAttendancePage />;
}
