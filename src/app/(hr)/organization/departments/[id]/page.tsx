import { DepartmentDetailPage } from "@/src/components/hr/departments/components/department-detail-page";

export default async function DepartmentDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DepartmentDetailPage id={id} />;
}
