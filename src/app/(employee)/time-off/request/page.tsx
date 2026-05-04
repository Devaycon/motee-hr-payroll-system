import dynamic from "next/dynamic";

const MyLeaveRequestPage = dynamic(() =>
  import("@/src/components/employee/leave-request").then(
    (m) => m.MyLeaveRequestPage,
  ),
);

export default function Page() {
  return <MyLeaveRequestPage />;
}
