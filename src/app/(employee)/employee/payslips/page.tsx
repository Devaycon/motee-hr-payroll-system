import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Payslips" };

const MyPayslipsPage = dynamic(() =>
  import("@/src/components/employee/payslips").then((m) => m.MyPayslipsPage),
);

export default function MyPayslipsRoute() {
  return <MyPayslipsPage />;
}
