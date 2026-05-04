import type { Metadata } from "next";
import { EmployeeDetailPage } from "@/src/components/hr/employees/components/employee-detail-page";

export const metadata: Metadata = {
  title: "Employee Profile",
};

export default async function EmployeeDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmployeeDetailPage id={id} />;
}
