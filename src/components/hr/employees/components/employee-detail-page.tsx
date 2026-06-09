"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  useEmployeeRecord,
  useEmployeeStats,
} from "../employee-detail/hooks";
import { EmployeeProfileWorkspace } from "../employee-detail/workspace";

interface EmployeeDetailPageProps {
  id: string;
}

export function EmployeeDetailPage({ id }: EmployeeDetailPageProps) {
  const router = useRouter();
  const { data: record, loading } = useEmployeeRecord(id);
  const { data: stats } = useEmployeeStats(id);

  if (loading && !record) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-[240px_1fr] gap-5">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground text-sm">Employee not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Go Back
        </Button>
      </div>
    );
  }

  const emp = record.employee;

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </Button>
        <span className="text-xs text-muted-foreground">/ Employees / {emp.fullName}</span>
      </div>

      <EmployeeProfileWorkspace id={id} employee={emp} stats={stats} variant="hr" />
    </div>
  );
}
