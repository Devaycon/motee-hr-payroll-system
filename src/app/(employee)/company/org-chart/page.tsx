import dynamic from "next/dynamic";

const EmployeeOrgChart = dynamic(() =>
  import("@/src/components/employee/directory").then(
    (m) => m.EmployeeOrgChart
  )
);

export default function OrgChartPage() {
  return <EmployeeOrgChart />;
}
