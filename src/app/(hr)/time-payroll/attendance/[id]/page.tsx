import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Attendance Record" };

const AttendanceDetailPage = dynamic(() =>
  import("@/src/components/hr/attendance/detail").then(
    (m) => m.AttendanceDetailPage,
  ),
);

export default async function AttendanceDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AttendanceDetailPage recordId={id} />;
}
