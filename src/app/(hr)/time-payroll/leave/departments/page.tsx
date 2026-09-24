import { Suspense } from "react";
import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Leave by Department" };

const DepartmentLeaveRankingPage = dynamic(() =>
  import("@/src/components/hr/leave/department-ranking-page").then(
    (m) => m.DepartmentLeaveRankingPage,
  ),
);

export default function LeaveByDepartmentRoute() {
  // The page reads `?year=` / `?by=` through useSearchParams.
  return (
    <Suspense>
      <DepartmentLeaveRankingPage />
    </Suspense>
  );
}
