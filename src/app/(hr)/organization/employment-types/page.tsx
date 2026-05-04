import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employment Types",
};

const EmploymentTypesPage = dynamic(() =>
  import("@/src/components/hr/employment-types").then(
    (m) => m.EmploymentTypesPage,
  ),
);

export default function EmploymentTypesRoute() {
  return <EmploymentTypesPage />;
}
