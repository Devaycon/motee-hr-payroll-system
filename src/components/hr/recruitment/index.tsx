"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Users,
  DoorOpen,
  CheckCircle2,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { cn } from "@/src/lib/utils";
import {
  REQUISITION_DISPLAY_STATUS,
  REQUISITION_DISPLAY_TONE_STYLES,
} from "@/src/data/recruitment-demo";
import type { JobRequisition } from "@/src/lib/types/recruitment";
import { useRecruitment } from "./hooks";

export function RecruitmentPage() {
  const router = useRouter();
  const { loading, bucket } = useRecruitment();

  const activeCountByReq = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of bucket.candidates) {
      if (c.status === "rejected") continue;
      m.set(c.requisitionId, (m.get(c.requisitionId) ?? 0) + 1);
    }
    return m;
  }, [bucket.candidates]);

  // Requested = drafts being built; Approved = published/active recruitments.
  const requestedList = useMemo(
    () => bucket.requisitions.filter((r) => r.status === "draft"),
    [bucket.requisitions],
  );
  const approvedList = useMemo(
    () => bucket.requisitions.filter((r) => r.status !== "draft"),
    [bucket.requisitions],
  );

  const stats = useMemo(() => {
    const openRoles = bucket.requisitions.filter((r) =>
      ["approved", "open", "interviewing", "offer_stage"].includes(r.status),
    ).length;
    const hired = bucket.candidates.filter(
      (c) => c.stage === "hired" && c.status !== "rejected",
    ).length;
    const activeApplicants = bucket.candidates.filter(
      (c) => c.status !== "rejected",
    ).length;
    return {
      reqs: bucket.requisitions.length,
      openRoles,
      applicants: activeApplicants,
      hired,
    };
  }, [bucket]);

  const columns = useMemo<ColumnDef<JobRequisition>[]>(
    () => [
      {
        id: "requisitionNumber",
        header: sortableHeader("Req. No."),
        accessorFn: (r) => r.requisitionNumber ?? r.id,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.requisitionNumber ?? row.original.id}
          </span>
        ),
      },
      {
        accessorKey: "positionTitle",
        header: sortableHeader("Role"),
        cell: ({ row }) => (
          <div className="font-medium text-foreground">
            {row.original.positionTitle}
            <p className="text-xs text-muted-foreground font-normal">
              {row.original.department}
            </p>
          </div>
        ),
      },
      {
        id: "applicants",
        header: sortableHeader("Applicants"),
        accessorFn: (r) => activeCountByReq.get(r.id) ?? 0,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-sm text-foreground">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            {activeCountByReq.get(row.original.id) ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "openings",
        header: "Openings",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.openings}
          </span>
        ),
      },
      {
        accessorKey: "targetStartDate",
        header: sortableHeader("Target start"),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.targetStartDate || "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const d = REQUISITION_DISPLAY_STATUS[row.original.status];
          return (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                REQUISITION_DISPLAY_TONE_STYLES[d.tone],
              )}
            >
              {d.label}
            </Badge>
          );
        },
      },
      actionsColumn<JobRequisition>((req) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/talent/recruitment/${req.id}`)}
            >
              <Eye className="w-3.5 h-3.5 mr-2" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/talent/recruitment/new?req=${req.id}`)
              }
            >
              <Pencil className="w-3.5 h-3.5 mr-2" />
              Edit recruitment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [activeCountByReq, router],
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap py-2">
        <div>
          <h1 className="text-4xl font-semibold text-foreground">Recruitment</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Each requisition runs its own pipeline. Open one to manage its
            applicants, interviews and hires.
          </p>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => router.push("/talent/recruitment/new")}
        >
          <Plus className="w-4 h-4" />
          Create Recruitment
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Requisitions", value: stats.reqs, icon: Briefcase },
          { label: "Open Roles", value: stats.openRoles, icon: DoorOpen },
          { label: "Applicants", value: stats.applicants, icon: Users },
          { label: "Hired", value: stats.hired, icon: CheckCircle2 },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="approved">
        <PageTabsList
          tabs={[
            { value: "requested", label: `Requested Recruitment (${requestedList.length})` },
            { value: "approved", label: `Approved Recruitment (${approvedList.length})` },
          ]}
        />

        <TabsContent value="requested" className="mt-5">
          <DataTable
            columns={columns}
            data={requestedList}
            getRowId={(r) => r.id}
            onRowClick={(r) => router.push(`/talent/recruitment/${r.id}`)}
            searchPlaceholder="Search recruitments…"
            emptyMessage="No draft recruitments. Create one from an approved requisition."
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-5">
          <DataTable
            columns={columns}
            data={approvedList}
            getRowId={(r) => r.id}
            onRowClick={(r) => router.push(`/talent/recruitment/${r.id}`)}
            searchPlaceholder="Search recruitments…"
            emptyMessage="No published recruitments yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
