import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "My Profile — Motee HR",
  description: "",
};

const EmployeeProfilePage = dynamic(() =>
  import("@/src/components/employee/profile").then(
    (m) => m.EmployeeProfilePage,
  ),
);

export default function HrMyProfileRoute() {
  return <EmployeeProfilePage />;
}
