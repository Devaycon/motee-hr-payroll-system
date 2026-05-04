import dynamic from "next/dynamic";

const EmployeeEventsPage = dynamic(() =>
  import("@/src/components/employee/events").then((m) => m.EmployeeEventsPage),
);

export default function EventsRoute() {
  return <EmployeeEventsPage />;
}
