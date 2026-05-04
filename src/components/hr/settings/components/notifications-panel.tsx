"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell, Mail, Monitor, Smartphone } from "lucide-react";
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
  NotificationPrefs,
  NotificationModule,
  DigestFrequency,
  LanguageOption,
} from "../types";
import { TIMEZONES, LANGUAGES } from "../data";

interface Props {
  prefs: NotificationPrefs;
  onChange: (updated: NotificationPrefs) => void;
}

export function NotificationsPanel({ prefs, onChange }: Props) {
  const [modules, setModules] = useState<NotificationModule[]>(prefs.modules);
  const [digest, setDigest] = useState<DigestFrequency>(prefs.digestFrequency);
  const [timezone, setTimezone] = useState(prefs.timezone);
  const [language, setLanguage] = useState<LanguageOption>(prefs.language);
  const [saving, setSaving] = useState(false);

  function handleModuleToggle(
    index: number,
    channel: "email" | "inApp" | "push",
    checked: boolean,
  ) {
    const updated = modules.map((m, i) =>
      i === index ? { ...m, [channel]: checked } : m,
    );
    setModules(updated);
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      onChange({ modules, digestFrequency: digest, timezone, language });
      setSaving(false);
      toast.success("Notification preferences saved.");
    }, 400);
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4.5 w-4.5 text-primary" />
            <CardTitle className="text-base">Notification Channels</CardTitle>
          </div>
          <CardDescription>
            Configure which channels receive notifications for each module.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Module
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Email</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Monitor className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">In-App</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Smartphone className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Push</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {modules.map((mod, i) => (
                  <tr
                    key={mod.module}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {mod.label}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={mod.email}
                        onCheckedChange={(v) =>
                          handleModuleToggle(i, "email", v)
                        }
                        className="mx-auto"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={mod.inApp}
                        onCheckedChange={(v) =>
                          handleModuleToggle(i, "inApp", v)
                        }
                        className="mx-auto"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={mod.push}
                        onCheckedChange={(v) =>
                          handleModuleToggle(i, "push", v)
                        }
                        className="mx-auto"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Digest &amp; Preferences</CardTitle>
          <CardDescription>
            Set how often you receive notification digests and your regional
            preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Digest Frequency</Label>
            <div className="flex gap-2 flex-wrap">
              {(
                [
                  { value: "immediate", label: "Immediate" },
                  { value: "daily", label: "Daily Digest" },
                  { value: "weekly", label: "Weekly Digest" },
                ] as { value: DigestFrequency; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDigest(opt.value)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    digest === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-transparent text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Language</Label>
              <Select
                value={language}
                onValueChange={(v) => setLanguage(v as LanguageOption)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
