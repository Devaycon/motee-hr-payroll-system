import dynamic from "next/dynamic";

const EmployeeAnnouncements = dynamic(() =>
  import("@/src/components/employee/announcements").then(
    (m) => m.EmployeeAnnouncements
  )
);

export default function AnnouncementsPage() {
  return <EmployeeAnnouncements />;
}
