"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Smartphone,
  Mail,
  KeyRound,
  RefreshCw,
  Copy,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type {
  TwoFactorConfig,
  TwoFactorMethod,
  TwoFactorEnforcement,
} from "../types";

const METHODS: {
  key: TwoFactorMethod;
  label: string;
  desc: string;
  icon: typeof Mail;
}[] = [
  { key: "authenticator", label: "Authenticator App", desc: "Time-based one-time codes (TOTP).", icon: ShieldCheck },
  { key: "email", label: "Email", desc: "Send a verification code by email.", icon: Mail },
  { key: "sms", label: "SMS", desc: "Send a verification code by text message.", icon: Smartphone },
];

const ENFORCEMENT_OPTIONS: { value: TwoFactorEnforcement; label: string }[] = [
  { value: "mandatory", label: "Mandatory for all users" },
  { value: "optional", label: "Optional" },
  { value: "admin-only", label: "Admins only" },
];

interface Props {
  config: TwoFactorConfig;
}

export function TwoFactorPanel({ config: initial }: Props) {
  const [config, setConfig] = useState<TwoFactorConfig>(initial);

  function setEnabled(enabled: boolean) {
    setConfig((prev) => ({ ...prev, enabled }));
    toast.success(
      enabled
        ? "Two-factor authentication enabled."
        : "Two-factor authentication disabled.",
    );
  }

  function setMethod(method: TwoFactorMethod, value: boolean) {
    setConfig((prev) => ({
      ...prev,
      methods: { ...prev.methods, [method]: value },
    }));
  }

  function setEnforcement(enforcement: TwoFactorEnforcement) {
    setConfig((prev) => ({ ...prev, enforcement }));
    toast.success("Enforcement policy updated.");
  }

  function regenerateCodes() {
    const codes = Array.from({ length: 5 }, () => {
      const block = () =>
        Math.random().toString(36).slice(2, 6).toUpperCase();
      return `${block()}-${block()}`;
    });
    setConfig((prev) => ({ ...prev, recoveryCodes: codes }));
    toast.success("New recovery codes generated.");
  }

  function copyCodes() {
    void navigator.clipboard?.writeText(config.recoveryCodes.join("\n"));
    toast.success("Recovery codes copied to clipboard.");
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            <CardTitle className="text-base">
              Two-Factor Authentication
            </CardTitle>
          </div>
          <CardDescription>
            Add a second verification step when users sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">
                {config.enabled
                  ? "2FA is enabled organisation-wide"
                  : "2FA is disabled"}
              </p>
              <p className="text-xs text-muted-foreground">
                {config.enabled
                  ? "Users will be prompted for a second factor based on the policy below."
                  : "Enable to require a second factor at sign-in."}
              </p>
            </div>
            <Switch checked={config.enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-3">
            <Label className="text-sm">Available methods</Label>
            {METHODS.map((m) => (
              <div
                key={m.key}
                className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <m.icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={config.methods[m.key]}
                  disabled={!config.enabled}
                  onCheckedChange={(v) => setMethod(m.key, v)}
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Enforcement policy</Label>
            <Select
              value={config.enforcement}
              onValueChange={(v) =>
                setEnforcement(v as TwoFactorEnforcement)
              }
              disabled={!config.enabled}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENFORCEMENT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4.5 w-4.5 text-primary" />
            <CardTitle className="text-base">Recovery Codes</CardTitle>
          </div>
          <CardDescription>
            One-time codes to access the account if a device is lost. Store them
            somewhere safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {config.recoveryCodes.map((code) => (
              <code
                key={code}
                className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-center font-mono text-sm tracking-wider"
              >
                {code}
              </code>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={copyCodes}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={regenerateCodes}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
