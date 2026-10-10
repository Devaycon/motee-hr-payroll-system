"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { getApiErrorMessage } from "@/src/lib/utils";
import { formatDate } from "@/src/lib/utils/format-date";
import { platformStaffSchema } from "@/src/lib/validations/platform";
import {
  useGetPlatformStaffQuery,
  useGetPlatformTenantQuery,
  useGetPlatformTenantsQuery,
  useGrantPlatformRoleMutation,
  useRevokePlatformRoleMutation,
} from "@/src/store/services/platform";
import type { PlatformRole } from "@/src/types/platform";

const PAGE_SIZE = 25;
const ROLES: PlatformRole[] = ["support", "finance", "admin"];

function TenantsTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetPlatformTenantsQuery({
    Page: page,
    PageSize: PAGE_SIZE,
  });
  const result = data?.data;

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  if (!result?.items.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No tenants yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {result.items.map((tenant) => (
              <li
                key={tenant.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 flex-col">
                  <Link
                    href={`/tenants/${tenant.id}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {tenant.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {tenant.slug} · {tenant.countryCode} · {tenant.employees}{" "}
                    employees · {tenant.users} users · joined{" "}
                    {formatDate(tenant.createdAt)}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {tenant.plan}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {tenant.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {result.totalItems} tenants · page {result.page}
          {result.totalPages ? ` of ${result.totalPages}` : ""}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={!result.hasNextPage || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function StaffTab() {
  const { data, isLoading } = useGetPlatformStaffQuery();
  const [grantRole, { isLoading: granting }] = useGrantPlatformRoleMutation();
  const [revokeRole] = useRevokePlatformRoleMutation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PlatformRole>("support");
  const staff = data?.data ?? [];

  async function handleGrant() {
    const parsed = platformStaffSchema.safeParse({ email, role });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      await grantRole(parsed.data).unwrap();
      toast.success(`${parsed.data.email} is now platform ${parsed.data.role}`);
      setEmail("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not grant the role."));
    }
  }

  async function handleRevoke(userId: string, name: string) {
    try {
      await revokeRole(userId).unwrap();
      toast.success(`${name} removed from platform staff`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the staff member."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-2 p-5">
          <div className="flex min-w-56 flex-1 flex-col gap-1.5">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@moteesolutions.com"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as PlatformRole)}>
              <SelectTrigger className="h-8 w-36 text-sm capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="text-sm capitalize">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={granting}
            onClick={handleGrant}
          >
            Grant access
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : (
        <Card>
          <CardContent className="p-0">
            {staff.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No platform staff yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {staff.map((member) => (
                  <li
                    key={member.userId}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="text-sm text-foreground">
                        {member.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {member.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        aria-label={`Remove ${member.name}`}
                        onClick={() => handleRevoke(member.userId, member.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** The Motee platform console: every tenant, and who on staff can see them. */
export function PlatformPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Platform</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Companies on Motee and the staff who support them.
        </p>
      </div>
      <Tabs defaultValue="tenants">
        <PageTabsList
          tabs={[
            { value: "tenants", label: "Tenants" },
            { value: "staff", label: "Platform Staff" },
          ]}
        />
        <TabsContent value="tenants" className="mt-5">
          <TenantsTab />
        </TabsContent>
        <TabsContent value="staff" className="mt-5">
          <StaffTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function PlatformTenantPage({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading } = useGetPlatformTenantQuery(id);
  const tenant = data?.data;

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="flex flex-col gap-5">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit gap-1.5 text-muted-foreground"
        onClick={() => router.push("/tenants")}
      >
        <ArrowLeft className="h-4 w-4" />
        All tenants
      </Button>
      {!tenant ? (
        <p className="text-sm text-muted-foreground">Tenant not found.</p>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                {tenant.name}
              </h1>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {tenant.plan}
                </Badge>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {tenant.status}
                </Badge>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ["Slug", tenant.slug],
                ["Country", tenant.countryCode],
                ["Billing email", tenant.billingEmail ?? "—"],
                ["Employees", String(tenant.employees)],
                ["Users", String(tenant.users)],
                ["Joined", formatDate(tenant.createdAt)],
                [
                  "Trial ends",
                  tenant.trialEndsAt ? formatDate(tenant.trialEndsAt) : "—",
                ],
                [
                  "Setup completed",
                  tenant.onboardingCompletedAt
                    ? formatDate(tenant.onboardingCompletedAt)
                    : "Not yet",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
