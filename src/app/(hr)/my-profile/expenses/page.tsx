import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "My Expenses — Motee HR",
  description: "",
};

const ExpensesPage = dynamic(() =>
  import("@/src/components/employee/expenses").then((m) => m.ExpensesPage),
);

export default function HrMyExpensesRoute() {
  return <ExpensesPage />;
}
