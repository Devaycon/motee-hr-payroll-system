import dynamic from "next/dynamic";

const MyPayslipsPage = dynamic(() =>
  import("@/src/components/employee/payslips").then((m) => m.MyPayslipsPage),
);

export default function Page() {
  return <MyPayslipsPage />;
}
