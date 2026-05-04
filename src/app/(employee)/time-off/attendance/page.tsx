import dynamic from "next/dynamic";

const MyAttendancePage = dynamic(() =>
  import("@/src/components/employee/attendance").then(
    (m) => m.MyAttendancePage,
  ),
);

export default function Page() {
  return <MyAttendancePage />;
}
