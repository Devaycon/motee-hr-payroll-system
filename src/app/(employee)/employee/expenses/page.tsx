import { Suspense } from "react";
import dynamic from "next/dynamic";

const ExpensesPage = dynamic(() =>
  import("@/src/components/employee/expenses").then((m) => m.ExpensesPage),
);

export default function EmployeeExpensesPage() {
  // ExpensesPage reads the `?draft=` param via useSearchParams, which opts the
  // route into client-side rendering and needs a boundary to prerender — same
  // pattern as /sign and /talent/workforce-requests.
  return (
    <Suspense>
      <ExpensesPage />
    </Suspense>
  );
}
