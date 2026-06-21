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
import {
  STATUS_LABELS,
  STATUS_STYLES,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_STYLES,
} from "@/src/components/employee/directory/components/data";
import { EmployeeDetailModal } from "@/src/components/employee/directory/components/employee-detail-modal";
import type { EmployeeRow } from "@/src/components/employee/directory/components/data";
import { useMyTeam } from "./hooks";

/** A single node card in the organogram. */
function OrgCard({
  name,
  initials,
  subtitle,
  meta,
  gender,
  manages,
  highlight = false,
  onClick,
}: {
  name: string;
  initials: string;
  subtitle?: string;
  meta?: string;
  gender?: string;
  manages?: number;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex w-44 flex-col items-center gap-2 rounded-xl border p-4 text-center shadow-sm",
        highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card",
        onClick && "cursor-pointer transition-colors hover:border-primary/40",
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
        {meta && (
          <p className="text-[10px] text-muted-foreground/80 mt-0.5">{meta}</p>
        )}
      </div>
      {highlight ? (
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-medium">
          You
        </span>
      ) : manages && manages > 0 ? (
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-medium">
          Manages {manages}
        </span>
      ) : null}
    </div>
  );
}

/** A compact "who you report to" banner shown above the team. */
function ReportingToCard({
  manager,
  onOpen,
}: {
  manager: EmployeeRow | null;
  onOpen: (emp: EmployeeRow) => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground shrink-0">
          Reporting to
        </span>
        {manager ? (
          <button
            type="button"
            onClick={() => onOpen(manager)}
            className="flex items-center gap-3 text-left"
          >
            <PersonAvatar
              name={manager.name}
              initials={manager.initials}
              gender={manager.gender}
              className="size-10"
              fallbackClassName="bg-primary/10 text-primary text-sm font-semibold"
            />
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">
                {manager.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {manager.jobTitle}
                {manager.department ? ` · ${manager.department}` : ""}
              </p>
            </div>
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">
            You don&apos;t currently report to anyone.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** The reporting line: manager → you → your direct reports. */
function TeamOrganogram({
  me,
  manager,
  reports,
  onOpen,
}: {
  me: EmployeeRow;
  manager: EmployeeRow | null;
  reports: EmployeeRow[];
  onOpen: (emp: EmployeeRow) => void;
}) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-8">
        <div className="flex min-w-max flex-col items-center">
          {manager && (
            <>
              <OrgCard
                name={manager.name}
                initials={manager.initials}
                subtitle={manager.jobTitle}
                meta={manager.department}
                gender={manager.gender}
                manages={manager.directReportCount}
                onClick={() => onOpen(manager)}
              />
              <span className="h-8 w-px bg-border" />
            </>
          )}
          <OrgCard
            name={me.name}
            initials={me.initials}
            subtitle={me.jobTitle}
            meta={me.department}
            gender={me.gender}
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
                      meta={r.department}
                      gender={r.gender}
                      manages={r.directReportCount}
                      onClick={() => onOpen(r)}
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
  const { me, manager, peers, reports, loading } = useMyTeam();
  const [selected, setSelected] = useState<EmployeeRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [tab, setTab] = useState("list");

  function openDetail(emp: EmployeeRow) {
    setSelected(emp);
    setDetailOpen(true);
  }

  // Managers see their direct reports; everyone else sees their peers (the
  // colleagues who share their manager) so the page is useful for all employees.
  const hasReports = reports.length > 0;
  const teamRows = hasReports ? reports : peers;
  const teamTitle = hasReports ? "Direct Reports" : "My Team";
  const teamDescription = hasReports
    ? "The employees who report directly to you."
    : "Your manager and the colleagues on your team.";

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
          See who you report to and the people on your team. View only.
        </p>
      </div>

      <ReportingToCard manager={manager} onOpen={openDetail} />

      {!loading && teamRows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Users className="w-7 h-7 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">
              No team members
            </p>
            <p className="text-xs text-muted-foreground">
              There are no direct reports or teammates to show right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <div className="mb-2">
            <h2 className="text-base font-semibold text-foreground">
              {teamTitle}
            </h2>
            <p className="text-xs text-muted-foreground">{teamDescription}</p>
          </div>

          <PageTabsList
            tabs={[
              { value: "list", label: "Team List" },
              { value: "organogram", label: "Organogram" },
            ]}
          />

          <TabsContent value="list" className="mt-5">
            <DataTable
              columns={columns}
              data={teamRows}
              getRowId={(e) => e.id}
              onRowClick={openDetail}
              searchPlaceholder="Search your team…"
              loading={loading}
              emptyMessage="No team members found."
            />
          </TabsContent>

          <TabsContent value="organogram" className="mt-5">
            {me && (
              <TeamOrganogram
                me={me}
                manager={manager}
                reports={reports}
                onOpen={openDetail}
              />
            )}
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
