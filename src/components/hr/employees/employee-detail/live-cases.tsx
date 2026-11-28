"use client";

import Link from "next/link";
import {
  useGetEmployeeDisciplinariesQuery,
  useGetEmployeeGrievancesQuery,
} from "@/src/store/services/er-cases";
import type { CaseRowDto } from "@/src/types/er-cases";
import { formatDate } from "@/src/lib/utils/format-date";
import { Cell, DataTable, Empty, LoadingPanel, Row, Section, StatusBadge } from "./ui";

const words = (v?: string | null) =>
  v ? v.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^\w/, (c) => c.toUpperCase()) : "—";

/**
 * Signed in, the employee's Employee Relations cases from the API:
 * grievances (GET /employees/{id}/grievances) or disciplinaries
 * (GET /employees/{id}/disciplinaries). Cases are worked on in Employee
 * Relations, so each row links there.
 */
export function LiveEmployeeCases({
  employeeId,
  kind,
}: {
  employeeId: string;
  kind: "grievances" | "disciplinaries";
}) {
  const grievances = useGetEmployeeGrievancesQuery(
    { employeeId, params: { PageSize: 100 } },
    { skip: kind !== "grievances" },
  );
  const disciplinaries = useGetEmployeeDisciplinariesQuery(
    { employeeId, params: { PageSize: 100 } },
    { skip: kind !== "disciplinaries" },
  );
  const q = kind === "grievances" ? grievances : disciplinaries;
  if (q.isLoading) return <LoadingPanel />;
  const rows: CaseRowDto[] = q.data?.data.items ?? [];

  return (
    <Section
      title={kind === "grievances" ? "Grievances" : "Disciplinaries"}
      description="Restricted — HR only. Cases are managed in Employee Relations."
    >
      {rows.length === 0 ? (
        <Empty
          label={kind === "grievances" ? "No grievances." : "No disciplinary records — clean history."}
        />
      ) : (
        <DataTable columns={["Case", "Raised", "Type", "Stage", "Priority", "Outcome", "Owner"]}>
          {rows.map((c) => (
            <Row key={c.id}>
              <Cell>
                <Link href={`/admin/grievance/${c.id}`} className="font-medium text-primary hover:underline">
                  {c.caseNumber}
                </Link>
              </Cell>
              <Cell>{formatDate(c.raisedOn)}</Cell>
              <Cell>{words(c.complaintType)}</Cell>
              <Cell>
                <StatusBadge status={words(c.stage)} />
              </Cell>
              <Cell>{words(c.priority)}</Cell>
              <Cell>{c.outcome ? words(c.outcome) : "—"}</Cell>
              <Cell>{c.caseOwnerName ?? c.investigatorName ?? "—"}</Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </Section>
  );
}
