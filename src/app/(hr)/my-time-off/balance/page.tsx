import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "My Leave Balance — Motee HR",
  description: "",
};

const MyLeaveBalancePage = dynamic(() =>
  import("@/src/components/employee/leave-balance").then(
    (m) => m.MyLeaveBalancePage,
  ),
);

export default function HrMyLeaveBalanceRoute() {
  return <MyLeaveBalancePage />;
}
