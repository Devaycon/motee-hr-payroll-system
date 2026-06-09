"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Shield,
  Smartphone,
  Activity,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import type { SecuritySettings, PasswordPolicy } from "../types";

const SESSION_TIMEOUT_OPTIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "480", label: "8 hours" },
];

interface Props {
  security: SecuritySettings;
  onChange: (updated: SecuritySettings) => void;
}

export function SecurityPanel({ security, onChange }: Props) {
  const [policy, setPolicy] = useState<PasswordPolicy>(security.passwordPolicy);
  const [devices, setDevices] = useState(security.trustedDevices);
  const [savingPolicy, setSavingPolicy] = useState(false);

  function handlePolicyChange<K extends keyof PasswordPolicy>(
    key: K,
    value: PasswordPolicy[K],
  ) {
    setPolicy((prev) => ({ ...prev, [key]: value }));
  }

  function handleSavePolicy() {
    setSavingPolicy(true);
    setTimeout(() => {
      onChange({
        ...security,
        passwordPolicy: policy,
      });
      setSavingPolicy(false);
      toast.success("Security settings saved.");
    }, 400);
  }

  function handleRevokeDevice(id: string) {
    const updated = devices.filter((d) => d.id !== id);
    setDevices(updated);
    onChange({ ...security, trustedDevices: updated });
    toast.success("Device revoked.");
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4.5 w-4.5 text-primary" />
            <CardTitle className="text-base">Password Policy</CardTitle>
          </div>
          <CardDescription>
            Set requirements for all user passwords in your organisation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">
                Minimum password length:{" "}
                <span className="font-semibold text-foreground">
                  {policy.minLength} characters
                </span>
              </Label>
            </div>
            <Slider
              min={6}
              max={24}
              step={1}
              value={[policy.minLength]}
              onValueChange={([v]) => handlePolicyChange("minLength", v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>6</span>
              <span>24</span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                key: "requireSpecialChars" as const,
                label: "Require special characters",
                desc: "e.g., @, #, !, $",
              },
              {
                key: "requireNumbers" as const,
                label: "Require numbers",
                desc: "At least one digit",
              },
              {
                key: "requireUppercase" as const,
                label: "Require uppercase letters",
                desc: "At least one uppercase letter",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={policy[item.key]}
                  onCheckedChange={(v) => handlePolicyChange(item.key, v)}
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Session timeout</Label>
            <Select
              value={String(policy.sessionTimeoutMinutes)}
              onValueChange={(v) =>
                handlePolicyChange("sessionTimeoutMinutes", Number(v))
              }
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TIMEOUT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" onClick={handleSavePolicy} disabled={savingPolicy}>
            {savingPolicy ? "Saving..." : "Save Policy"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4.5 w-4.5 text-primary" />
            <CardTitle className="text-base">Trusted Devices</CardTitle>
          </div>
          <CardDescription>
            Devices that have been verified with your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/10 px-4 py-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{device.name}</p>
                  {device.isCurrent && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {device.browser} &middot; {device.os} &middot; Last seen{" "}
                  {new Date(device.lastSeen).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              {!device.isCurrent && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Revoke
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke Device</AlertDialogTitle>
                      <AlertDialogDescription>
                        Remove{" "}
                        <span className="font-semibold">{device.name}</span>{" "}
                        from trusted devices? The device will need to verify
                        again on next login.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handleRevokeDevice(device.id)}
                      >
                        Revoke
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
          {devices.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No trusted devices.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-primary" />
            <CardTitle className="text-base">Login Activity</CardTitle>
          </div>
          <CardDescription>
            Recent login events for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                    IP Address
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">
                    Device
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {(security.loginActivity ?? []).map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-4 py-3 text-foreground">{entry.event}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">
                      {entry.ipAddress}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {entry.location}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                      {entry.device}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(entry.timestamp).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {entry.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
