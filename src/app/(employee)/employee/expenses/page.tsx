import dynamic from "next/dynamic";

const ExpensesPage = dynamic(() =>
  import("@/src/components/employee/expenses").then((m) => m.ExpensesPage),
);

export default function EmployeeExpensesPage() {
  return <ExpensesPage />;
}
