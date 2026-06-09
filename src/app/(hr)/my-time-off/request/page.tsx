import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Request Leave — Motee HR",
  description: "",
};

const MyLeaveRequestPage = dynamic(() =>
  import("@/src/components/employee/leave-request").then(
    (m) => m.MyLeaveRequestPage,
  ),
);

export default function HrMyLeaveRequestRoute() {
  return <MyLeaveRequestPage />;
}
