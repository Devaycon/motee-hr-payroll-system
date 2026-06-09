"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ArrowRightLeft, Trash2, UserPlus } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { removeRecord } from "@/src/lib/stores/onboarding-records-slice";
import { formatDate } from "@/src/lib/utils/format-date";
import type { OnboardingRecord } from "./types";
import { OnboardingPage } from "./index";

export function PreboardingOnboardingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const records = useAppSelector((s) => s.onboardingRecords.records);

  const preboarding = useMemo(
    () => records.filter((r) => r.phase === "preboarding"),
    [records],
  );
  // Active onboarding-pipeline records (everything that isn't preboarding or cleared).
  const onboardingCount = useMemo(
    () =>
      records.filter((r) => r.phase !== "preboarding" && r.status !== "completed")
        .length,
    [records],
  );

  const columns = useMemo<ColumnDef<OnboardingRecord>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
              {row.original.employeeInitials}
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">{row.original.employeeName}</p>
              <p className="text-[11px] text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        id: "assets",
        header: "Assets",
        cell: ({ row }) => {
          const a = row.original.assets ?? [];
          return (
            <span className="text-xs text-muted-foreground">
              {a.length === 0
                ? "—"
                : `${a[0].assetType || "Asset"}${a.length > 1 ? ` +${a.length - 1}` : ""}`}
            </span>
          );
        },
      },
      {
        accessorKey: "initiatedAt",
        header: sortableHeader("Registered"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.initiatedAt ? formatDate(row.original.initiatedAt) : "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: () => (
          <Badge
            variant="outline"
            className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-600"
          >
            Preboarding
          </Badge>
        ),
      },
      actionsColumn<OnboardingRecord>((record) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            className="h-7 gap-1 text-[11px]"
            onClick={() => router.push(`/talent/onboarding/new?preboarding=${record.id}`)}
          >
            <ArrowRightLeft className="w-3 h-3" /> Continue to Onboarding
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-rose-600"
            onClick={() => {
              dispatch(removeRecord(record.id));
              toast.success("Preboarding record removed");
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )),
    ],
    [router, dispatch],
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-4xl font-semibold text-foreground">
          Preboarding &amp; Onboarding
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Capture new hires early with lightweight preboarding, then flow them into full
          onboarding.
        </p>
      </div>

      <Tabs defaultValue="preboarding">
        <PageTabsList
          tabs={[
            { value: "preboarding", label: `Preboarding (${preboarding.length})` },
            { value: "onboarding", label: `Onboarding (${onboardingCount})` },
          ]}
        />

        <TabsContent value="preboarding" className="mt-5">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <Button className="gap-1.5" onClick={() => router.push("/talent/onboarding/preboard")}>
                <Plus className="w-4 h-4" /> Initiate Preboarding
              </Button>
            </div>
            {preboarding.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
                <UserPlus className="w-6 h-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No preboarding hires yet. Click “Initiate Preboarding” to register one.
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={preboarding}
                getRowId={(r) => r.id}
                searchPlaceholder="Search preboarding…"
                emptyMessage="No preboarding hires."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="mt-5">
          <OnboardingPage embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
