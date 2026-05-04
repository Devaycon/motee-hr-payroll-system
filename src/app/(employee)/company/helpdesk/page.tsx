import dynamic from "next/dynamic";
const EmployeeHelpdeskPage = dynamic(() =>
  import("@/src/components/employee/helpdesk").then((m) => m.EmployeeHelpdeskPage)
);
export default function HelpdeskPage() { return <EmployeeHelpdeskPage />; }
