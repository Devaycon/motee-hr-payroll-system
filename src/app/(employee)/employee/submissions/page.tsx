import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "My Submissions — Motee",
  description: "",
};

const MySubmissionsPage = dynamic(() =>
  import("@/src/components/employee/approvals").then(
    (m) => m.MyApprovalsPage,
  ),
);

export default function EmployeeSubmissionsRoute() {
  return <MySubmissionsPage />;
}
