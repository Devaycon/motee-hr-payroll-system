import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Leave Management" };

const LeaveManagementPage = dynamic(() =>
  import("@/src/components/hr/leave").then((m) => m.LeaveManagementPage),
);

export default function LeaveRoute() {
  return <LeaveManagementPage />;
}
