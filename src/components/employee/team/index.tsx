"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Card, CardContent } from "@/src/components/ui/card";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  DataTable,
  sortableHeader,
} from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_STYLES,
} from "@/src/components/employee/directory/components/data";
import { EmployeeDetailModal } from "@/src/components/employee/directory/components/employee-detail-modal";
import type { EmployeeRow } from "@/src/components/employee/directory/components/data";
import { useDirectReports } from "./hooks";

/** A single node card in the organogram. */
function OrgCard({
  name,
  initials,
  subtitle,
  gender,
  highlight = false,
}: {
  name: string;
  initials: string;
  subtitle?: string;
  gender?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-44 flex-col items-center gap-2 rounded-xl border p-4 text-center shadow-sm",
        highlight
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card",
      )}
    >
      <PersonAvatar
        name={name}
        initials={initials}
        gender={gender}
        className="size-12"
        fallbackClassName="bg-primary/10 text-primary text-sm font-semibold"
      />
      <div>
        <p className="text-sm font-semibold text-foreground leading-tight">
          {name}
        </p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {highlight && (
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-medium">
          You
        </span>
      )}
    </div>
  );
}

/** The logged-in user heading their direct reports. */
function TeamOrganogram({ reports }: { reports: EmployeeRow[] }) {
  const user = useAppSelector((s) => s.auth.user);
  return (
    <Card>
      <CardContent className="overflow-x-auto p-8">
        <div className="flex min-w-max flex-col items-center">
          <OrgCard
            name={user?.name ?? "You"}
            initials={user?.initials ?? "ME"}
            subtitle={user?.jobTitle}
            highlight
          />
          {reports.length > 0 && (
            <>
              <span className="h-8 w-px bg-border" />
              <div className="flex justify-center gap-6 border-t border-border pt-8">
                {reports.map((r) => (
                  <div
                    key={r.id}
                    className="relative flex flex-col items-center"
                  >
                    <span className="absolute -top-8 h-8 w-px bg-border" />
                    <OrgCard
                      name={r.name}
                      initials={r.initials}
                      subtitle={r.jobTitle}
                      gender={r.gender}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MyTeam() {
  const { reports, loading } = useDirectReports();
  const [selected, setSelected] = useState<EmployeeRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [tab, setTab] = useState("list");

  function openDetail(emp: EmployeeRow) {
    setSelected(emp);
    setDetailOpen(true);
  }

  const columns = useMemo<ColumnDef<EmployeeRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <PersonAvatar
              name={row.original.name}
              initials={row.original.initials}
              gender={row.original.gender}
              className="size-8 shrink-0"
              fallbackClassName="bg-primary/10 text-primary text-xs font-semibold"
            />
            <div>
              <span className="text-sm font-medium text-foreground">
                {row.original.name}
              </span>
              <p className="text-[11px] text-muted-foreground">
                {row.original.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "jobTitle",
        header: sortableHeader("Job Title"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.jobTitle}
          </span>
        ),
      },
      {
        accessorKey: "department",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.department}
          </span>
        ),
      },
      {
        accessorKey: "employmentType",
        header: sortableHeader("Employment Type"),
        cell: ({ row }) => (
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-medium",
              EMPLOYMENT_TYPE_STYLES[row.original.employmentType] ?? "",
            )}
          >
            {EMPLOYMENT_TYPE_LABELS[row.original.employmentType] ??
              row.original.employmentType}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-medium",
              STATUS_STYLES[row.original.status] ?? "",
            )}
          >
            {STATUS_LABELS[row.original.status] ?? row.original.status}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Team</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          The employees who report directly to you. View only.
        </p>
      </div>

      {!loading && reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Users className="w-7 h-7 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">
              No direct reports
            </p>
            <p className="text-xs text-muted-foreground">
              You don&apos;t currently have any employees reporting to you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <PageTabsList
            tabs={[
              { value: "list", label: "Team List" },
              { value: "organogram", label: "Organogram" },
            ]}
          />

          <TabsContent value="list" className="mt-5">
            <DataTable
              columns={columns}
              data={reports}
              getRowId={(e) => e.id}
              onRowClick={openDetail}
              searchPlaceholder="Search your team…"
              loading={loading}
              emptyMessage="No team members found."
            />
          </TabsContent>

          <TabsContent value="organogram" className="mt-5">
            <TeamOrganogram reports={reports} />
          </TabsContent>
        </Tabs>
      )}

      <EmployeeDetailModal
        open={detailOpen}
        employee={selected}
        onClose={setDetailOpen}
      />
    </div>
  );
}
