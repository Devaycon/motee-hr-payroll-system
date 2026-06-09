import dynamic from "next/dynamic";

const TasksPage = dynamic(() =>
  import("@/src/components/hr/tasks").then((m) => m.TasksPage),
);

export default function TasksRoute() {
  return <TasksPage />;
}
