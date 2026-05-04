import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

export default function OnboardTenantPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Onboard New Tenant
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up a new tenant workspace, billing owner, and starter plan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Tenant Setup Wizard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenant-name">Organization Name</Label>
                <Input id="tenant-name" placeholder="e.g. Acme Holdings" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input id="admin-email" placeholder="admin@acme.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-email">Billing Email</Label>
                <Input id="billing-email" placeholder="billing@acme.com" />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">Step 1</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    Create organization workspace
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">Step 2</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    Assign billing and super admin
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">Step 3</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    Enable modules and send invite
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline">Save Draft</Button>
              <Button className="bg-primary text-primary-foreground">
                Create Tenant
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Confirm company legal name and billing address</p>
            <p>• Verify primary admin email ownership</p>
            <p>• Select base modules for payroll and attendance</p>
            <p>• Confirm employee seat estimate for provisioning</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
