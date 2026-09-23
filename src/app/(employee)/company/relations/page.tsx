import dynamic from "next/dynamic";
const EmployeeRelationsPage = dynamic(() =>
  import("@/src/components/employee/relations").then((m) => m.EmployeeRelationsPage)
);
export default function RelationsPage() { return <EmployeeRelationsPage />; }
