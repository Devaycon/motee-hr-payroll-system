import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Departments",
};

const DepartmentsPage = dynamic(() =>
  import("@/src/components/hr/departments").then((m) => m.DepartmentsPage),
);

export default function DepartmentsRoute() {
  return <DepartmentsPage />;
}
