import dynamic from "next/dynamic";

const MyLeaveBalancePage = dynamic(() =>
  import("@/src/components/employee/leave-balance").then(
    (m) => m.MyLeaveBalancePage,
  ),
);

export default function Page() {
  return <MyLeaveBalancePage />;
}
