import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employee Checklist",
};

const EmployeeChecklistPage = dynamic(() =>
  import("@/src/components/hr/employee-checklist").then(
    (m) => m.EmployeeChecklistPage,
  ),
);

export default function EmployeeChecklistRoute() {
  return <EmployeeChecklistPage />;
}
