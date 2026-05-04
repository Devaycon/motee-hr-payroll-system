import dynamic from "next/dynamic";

const EmployeeTraining = dynamic(() =>
  import("@/src/components/employee/training").then((m) => m.EmployeeTraining),
);

export default function TrainingPage() {
  return <EmployeeTraining />;
}
