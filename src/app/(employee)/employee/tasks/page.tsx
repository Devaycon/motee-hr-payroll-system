import dynamic from "next/dynamic";

const EmployeeTasksPage = dynamic(() =>
  import("@/src/components/employee/tasks").then((m) => m.EmployeeTasksPage),
);

export default function TasksRoute() {
  return <EmployeeTasksPage />;
}
