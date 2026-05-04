import dynamic from "next/dynamic";

const EmployeesPage = dynamic(() =>
  import("@/src/components/hr/employees").then((m) => m.EmployeesPage),
);

export default function EmployeesRoute() {
  return <EmployeesPage />;
}
