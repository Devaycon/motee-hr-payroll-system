import Link from "next/link";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { DEMO_TENANTS } from "@/src/data/motee-demo";

export default function TenantProfilesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tenant Profiles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse each tenant profile and open a detailed account view.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {DEMO_TENANTS.map((tenant) => (
          <Card key={tenant.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  {tenant.name}
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tenant.billingEmail}
                </p>
              </div>
              <Badge variant="outline" className="text-xs capitalize">
                {tenant.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="font-medium text-foreground capitalize">
                    {tenant.plan}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Employees</p>
                  <p className="font-medium text-foreground">
                    {tenant.employeeCount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">MRR</p>
                  <p className="font-medium text-foreground">
                    ${tenant.mrr.toLocaleString()}
                  </p>
                </div>
              </div>

              <Button
                asChild
                size="sm"
                className="bg-primary text-primary-foreground"
              >
                <Link href={`/tenants/${tenant.id}`}>Open Profile</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
