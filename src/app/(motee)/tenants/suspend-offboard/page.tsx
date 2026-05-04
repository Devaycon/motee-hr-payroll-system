import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { DEMO_TENANTS } from "@/src/data/motee-demo";

const impactedTenants = DEMO_TENANTS.filter(
  (tenant) => tenant.status === "trial" || tenant.status === "suspended",
);

export default function SuspendOffboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Suspend / Offboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage account freezes, cancellations, and offboarding actions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Tenant Lifecycle Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {impactedTenants.map((tenant) => (
            <div
              key={tenant.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {tenant.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tenant.billingEmail} •{" "}
                  {tenant.employeeCount.toLocaleString()} employees
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize text-xs">
                  {tenant.status}
                </Badge>
                <Button variant="outline" size="sm">
                  Freeze Account
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground"
                >
                  Start Offboarding
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
