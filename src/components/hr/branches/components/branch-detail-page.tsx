"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Building2,
  Users,
  MapPin,
  Mail,
  Phone,
  CalendarDays,
  Hash,
  Filter,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import type { HrStatCardItem } from "@/src/components/shared/hr-stat-card";
import { formatDate } from "@/src/lib/utils/format-date";
import { cn } from "@/src/lib/utils";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { setActiveBranch } from "@/src/lib/stores/branch-slice";
import { BRANCH_KIND_LABELS, BRANCH_STATUS_STYLES } from "../data";
import { useBranch } from "../hooks";

export function BranchDetailPage({ branchId }: { branchId: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { branch, staff, loading } = useBranch(branchId);

  const byDepartment = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of staff) {
      counts.set(e.departmentName, (counts.get(e.departmentName) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [staff]);

  if (loading && !branch) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="flex flex-col items-start gap-4 py-12">
        <h1 className="text-2xl font-semibold text-foreground">
          Branch not found
        </h1>
        <p className="text-sm text-muted-foreground">
          It may have been deleted, or it belongs to a different tenant.
        </p>
        <Button variant="outline" onClick={() => router.push("/organization/branches")}>
          <ChevronLeft className="size-4" /> Back to branches
        </Button>
      </div>
    );
  }

  const stats: HrStatCardItem[] = [
    {
      icon: Users,
      label: "People Posted",
      value: branch.employeeCount,
      sub: branch.headcountTarget
        ? `target ${branch.headcountTarget}`
        : "no target set",
      tone: "blue",
    },
    {
      icon: Building2,
      label: "Departments",
      value: branch.departmentCount,
      sub: "represented on site",
    },
    {
      icon: Hash,
      label: "Open Positions",
      value: branch.openPositions,
      sub: branch.openPositions > 0 ? "below target" : "at or above target",
      tone: branch.openPositions > 0 ? "amber" : undefined,
    },
    {
      icon: CalendarDays,
      label: "Opened",
      value: branch.openedAt ? formatDate(branch.openedAt) : "—",
      sub: BRANCH_KIND_LABELS[branch.kind],
    },
  ];

  const detail = [
    { icon: MapPin, label: "Address", value: branch.addressLabel || "—" },
    { icon: Phone, label: "Phone", value: branch.phone || "—" },
    { icon: Mail, label: "Email", value: branch.email || "—" },
    { icon: Clock, label: "Timezone", value: branch.timezone || "—" },
    { icon: Hash, label: "Code", value: branch.code },
  ];

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="pt-6">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 -ml-2 mb-3 gap-1 text-muted-foreground"
          onClick={() => router.push("/organization/branches")}
        >
          <ChevronLeft className="size-4" /> Branches
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-bold text-foreground">
                {branch.name}
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 capitalize",
                  BRANCH_STATUS_STYLES[branch.status],
                )}
              >
                {branch.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {BRANCH_KIND_LABELS[branch.kind]}
              {branch.city ? ` · ${branch.city}` : ""}
              {branch.country ? `, ${branch.country}` : ""}
            </p>
          </div>

          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              dispatch(setActiveBranch(branch.id));
              toast.success(`Now showing ${branch.name} only`, {
                description:
                  "Change this any time from the branch switcher in the header.",
              });
            }}
          >
            <Filter className="size-4" /> Scope app to this branch
          </Button>
        </div>
      </div>

      <HrStatCardsGrid stats={stats} columns={4} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Site details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {detail.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="text-sm text-foreground break-words">{value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branch head</CardTitle>
          </CardHeader>
          <CardContent>
            {branch.managerName && branch.managerEmployeeId ? (
              <Link
                href={`/organization/employees/${branch.managerEmployeeId}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <PersonAvatar
                  name={branch.managerName}
                  initials={branch.managerInitials}
                  className="size-10 shrink-0"
                  fallbackClassName="bg-primary/10 text-primary text-xs font-semibold"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {branch.managerName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    View employee record
                  </p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No branch head assigned yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">
            Departments on site{" "}
            <span className="text-muted-foreground font-normal">
              ({byDepartment.length})
            </span>
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/organization/employees?branch=${encodeURIComponent(branch.id)}`}
            >
              View all {branch.employeeCount} employees
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {byDepartment.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Nobody is posted to this branch yet.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {byDepartment.map(([name, count]) => (
                <div
                  key={name}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <span className="text-sm text-foreground truncate">
                    {name}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            People here{" "}
            <span className="text-muted-foreground font-normal">
              ({staff.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Nobody is posted to this branch yet. Assign a branch on an
              employee&apos;s record to place them here.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {staff.map((e) => (
                <Link
                  key={e.id}
                  href={`/organization/employees/${e.id}`}
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 hover:bg-accent transition-colors"
                >
                  <PersonAvatar
                    name={e.fullName}
                    initials={e.initials}
                    className="size-8 shrink-0"
                    fallbackClassName="bg-primary/10 text-primary text-[10px] font-semibold"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {e.fullName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {e.jobTitle}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
