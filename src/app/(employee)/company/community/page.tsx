import dynamic from "next/dynamic";
const EmployeeCommunityPage = dynamic(() =>
  import("@/src/components/employee/community").then((m) => m.EmployeeCommunityPage)
);
export default function CommunityPage() { return <EmployeeCommunityPage />; }
