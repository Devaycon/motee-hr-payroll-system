import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "My Training — Motee HR",
  description: "",
};

const EmployeeTraining = dynamic(() =>
  import("@/src/components/employee/training").then((m) => m.EmployeeTraining),
);

export default function HrMyTrainingRoute() {
  return <EmployeeTraining />;
}
